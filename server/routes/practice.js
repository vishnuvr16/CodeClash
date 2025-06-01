const express = require("express")
const Problem = require("../models/Problem")
const User = require("../models/User")
const { evaluateCode, runCode } = require("../utils/codeEvaluation")
const { authenticateToken } = require("../middleware/auth")
const router = express.Router()

// Get all practice problems with filtering, sorting, and pagination
router.get("/problems", async (req, res) => {
  try {
    const { page = 1, limit = 10, difficulty, tags, search, sortBy = "createdAt", order = "desc" } = req.query

    // Build filter object
    const filter = {}

    if (difficulty && difficulty !== "all") {
      filter.difficulty = difficulty
    }

    if (tags && tags !== "all") {
      filter.tags = { $in: [tags] }
    }

    if (search) {
      filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Build sort object
    const sortOrder = order === "asc" ? 1 : -1
    const sort = {}
    sort[sortBy] = sortOrder

    // Calculate pagination
    const pageNum = Number.parseInt(page)
    const limitNum = Number.parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Get problems with pagination
    const problems = await Problem.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-testCases.isHidden -testCases.output")

    // Get total count for pagination
    const totalProblems = await Problem.countDocuments(filter)
    const totalPages = Math.ceil(totalProblems / limitNum)

    // If user is authenticated, check which problems they've solved
    let solvedProblems = []
    if (req.user) {
      const user = await User.findById(req.user.id).populate("solvedProblems")
      solvedProblems = user.solvedProblems.map((p) => p._id.toString())
    }

    // Add isSolved flag to each problem
    const problemsWithSolvedStatus = problems.map((problem) => ({
      ...problem.toObject(),
      isSolved: solvedProblems.includes(problem._id.toString()),
    }))

    res.json({
      success: true,
      problems: problemsWithSolvedStatus,
      currentPage: pageNum,
      totalPages,
      totalProblems,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    })
  } catch (error) {
    console.error("Error fetching practice problems:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching practice problems",
      error: error.message,
    })
  }
})

// Get available tags
router.get("/tags", async (req, res) => {
  try {
    const tags = await Problem.distinct("tags")
    res.json({
      success: true,
      tags: tags.filter((tag) => tag && tag.trim() !== ""),
    })
  } catch (error) {
    console.error("Error fetching tags:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching tags",
      error: error.message,
    })
  }
})

// Get a specific practice problem
router.get("/problems/:id", async (req, res) => {
  try {
    const { id } = req.params

    const problem = await Problem.findById(id)
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      })
    }

    // Check if user has solved this problem
    let isSolved = false
    if (req.user) {
      const user = await User.findById(req.user.id)
      isSolved = user.solvedProblems.includes(id)
    }

    // Filter out hidden test cases for public view
    const publicTestCases = problem.testCases.filter((tc) => !tc.isHidden)

    res.json({
      success: true,
      problem: {
        ...problem.toObject(),
        testCases: publicTestCases,
        isSolved,
      },
    })
  } catch (error) {
    console.error("Error fetching problem:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching problem",
      error: error.message,
    })
  }
})

// Run code against a single test case (for testing)
router.post("/problems/:id/run", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { code, language, testCaseIndex = 0 } = req.body

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "Code and language are required",
      })
    }

    // Find the problem
    const problem = await Problem.findById(id)
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      })
    }

    // Get the test case (use public test cases only)
    const publicTestCases = problem.testCases.filter((tc) => !tc.isHidden)

    if (testCaseIndex >= publicTestCases.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid test case index",
      })
    }

    const testCase = publicTestCases[testCaseIndex]

    // Run the code
    const result = await runCode(code, language, {
      input: testCase.input,
      output: testCase.output,
    })

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || "Code execution failed",
      })
    }

    res.json({
      success: true,
      result: result.result,
    })
  } catch (error) {
    console.error("Error running code:", error)
    res.status(500).json({
      success: false,
      message: "Error running code",
      error: error.message,
    })
  }
})

// Submit solution for a practice problem
router.post("/problems/:id/submit", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { code, language } = req.body

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "Code and language are required",
      })
    }

    // Find the problem
    const problem = await Problem.findById(id)
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      })
    }

    // Evaluate code against all test cases
    const evaluation = await evaluateCode(code, language, problem.testCases)

    if (!evaluation.success) {
      return res.status(400).json({
        success: false,
        message: evaluation.error || "Code evaluation failed",
      })
    }

    const isCorrect = evaluation.allPassed

    // If solution is correct, update user's solved problems
    if (isCorrect) {
      const user = await User.findById(req.user.id)

      if (!user.solvedProblems.includes(id)) {
        user.solvedProblems.push(id)
        await user.save()

        // Increment problem's solved count
        await Problem.findByIdAndUpdate(id, {
          $inc: { solvedCount: 1 },
        })
      }
    }

    res.json({
      success: true,
      isCorrect,
      evaluation,
      message: isCorrect ? "Congratulations! Solution accepted." : "Solution incorrect. Please try again.",
    })
  } catch (error) {
    console.error("Error submitting solution:", error)
    res.status(500).json({
      success: false,
      message: "Error submitting solution",
      error: error.message,
    })
  }
})

// Get user's practice statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("solvedProblems")

    const stats = {
      totalSolved: user.solvedProblems.length,
      easySolved: user.solvedProblems.filter((p) => p.difficulty === "Easy").length,
      mediumSolved: user.solvedProblems.filter((p) => p.difficulty === "Medium").length,
      hardSolved: user.solvedProblems.filter((p) => p.difficulty === "Hard").length,
      recentlySolved: user.solvedProblems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    }

    res.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Error fetching practice stats:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching practice statistics",
      error: error.message,
    })
  }
})

module.exports = router
