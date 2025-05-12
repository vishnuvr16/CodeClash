const express = require("express")
const Problem = require("../models/Problem")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")
const { evaluateCode, runCode } = require("../utils/codeEvaluation")

const router = express.Router()

// Get all problems with filtering and pagination
router.get("/problems", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, difficulty, search, tags, sortBy = "createdAt", order = "desc" } = req.query

    // Build query
    const query = {}

    if (difficulty && difficulty !== "all") {
      query.difficulty = difficulty
    }

    if (search) {
      query.title = { $regex: search, $options: "i" }
    }

    if (tags) {
      const tagArray = tags.split(",").map((tag) => tag.trim())
      query.tags = { $in: tagArray }
    }

    // Execute query with pagination
    const sortOrder = order === "asc" ? 1 : -1
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder

    const problems = await Problem.find(query)
      .select("title difficulty tags solvedCount createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions)

    // Get total count
    const count = await Problem.countDocuments(query)

    // Get user's solved problems
    const user = await User.findById(req.user._id).select("solvedProblems")
    const solvedProblems = user.solvedProblems || []

    // Add isSolved flag to each problem
    const problemsWithSolvedStatus = problems.map((problem) => {
      const problemObj = problem.toObject()
      problemObj.isSolved = solvedProblems.includes(problem._id.toString())
      return problemObj
    })

    res.status(200).json({
      problems: problemsWithSolvedStatus,
      totalPages: Math.ceil(count / limit),
      currentPage: Number.parseInt(page),
      totalProblems: count,
    })
  } catch (error) {
    console.error("Error fetching problems:", error)
    res.status(500).json({
      message: "Server error while fetching problems",
    })
  }
})

// Get a single problem for practice
router.get("/problems/:id", authenticateToken, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      })
    }

    // Get user's submission for this problem if exists
    const user = await User.findById(req.user._id)
      .select("solvedProblems submissions")
      .populate({
        path: "submissions",
        match: { problem: req.params.id },
        select: "code language isCorrect submittedAt",
      })

    const isSolved = user.solvedProblems.includes(problem._id.toString())
    const submissions = user.submissions || []

    res.status(200).json({
      problem,
      isSolved,
      submissions,
    })
  } catch (error) {
    console.error("Error fetching problem:", error)
    res.status(500).json({
      message: "Server error while fetching problem",
    })
  }
})

// Run code for a practice problem
router.post("/problems/:id/run", authenticateToken, async (req, res) => {
  try {
    const { code, language, testCaseIndex } = req.body
    const userId = req.user._id

    // Find problem
    const problem = await Problem.findById(req.params.id)

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      })
    }

    // Get the test case
    const testCase = problem.testCases[testCaseIndex] || problem.testCases[0]

    if (!testCase) {
      return res.status(400).json({
        message: "No test cases available for this problem",
      })
    }

    // Run code using Judge0 API (or our utility for now)
    const result = await runCode(code, language, testCase)

    res.status(200).json({
      result: result.result,
    })
  } catch (error) {
    console.error("Error running code:", error)
    res.status(500).json({
      message: "Server error while running code",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Submit solution for a practice problem
router.post("/problems/:id/submit", authenticateToken, async (req, res) => {
  try {
    const { code, language } = req.body
    const userId = req.user._id

    // Find problem
    const problem = await Problem.findById(req.params.id)

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      })
    }

    // Evaluate code against all test cases
    const evaluation = await evaluateCode(code, language, problem.testCases)

    // Create submission
    const submission = {
      user: userId,
      problem: problem._id,
      code,
      language,
      isCorrect: evaluation.allPassed,
      results: evaluation.results,
      submittedAt: new Date(),
    }

    // Add submission to user's submissions
    await User.findByIdAndUpdate(userId, {
      $push: { submissions: submission },
    })

    // If all test cases passed, add problem to user's solved problems
    if (evaluation.allPassed) {
      const user = await User.findById(userId)

      // Only add to solved problems if not already solved
      if (!user.solvedProblems.includes(problem._id.toString())) {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { solvedProblems: problem._id },
        })

        // Increment problem's solved count
        await Problem.findByIdAndUpdate(problem._id, {
          $inc: { solvedCount: 1 },
        })
      }
    }

    res.status(200).json({
      message: "Solution submitted successfully",
      isCorrect: evaluation.allPassed,
      results: evaluation.results,
    })
  } catch (error) {
    console.error("Error submitting solution:", error)
    res.status(500).json({
      message: "Server error while submitting solution",
    })
  }
})

// Get user's solved problems
router.get("/solved", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("solvedProblems")

    res.status(200).json({
      solvedProblems: user.solvedProblems || [],
    })
  } catch (error) {
    console.error("Error fetching solved problems:", error)
    res.status(500).json({
      message: "Server error while fetching solved problems",
    })
  }
})

// Get user's submissions for a problem
router.get("/problems/:id/submissions", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("submissions")
      .populate({
        path: "submissions",
        match: { problem: req.params.id },
        select: "code language isCorrect submittedAt",
        options: { sort: { submittedAt: -1 } },
      })

    res.status(200).json({
      submissions: user.submissions || [],
    })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    res.status(500).json({
      message: "Server error while fetching submissions",
    })
  }
})

module.exports = router
