const express = require("express")
const Problem = require("../models/Problem")
const User = require("../models/User")
const {authenticateToken} = require("../middleware/auth")
const { evaluateCode, runCode } = require("../utils/codeEvaluation")

const router = express.Router()

// Trophy rewards for different difficulties
const TROPHY_REWARDS = {
  Easy: 5,
  Medium: 10,
  Hard: 15,
}

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
    const problems = await Problem.find(filter).sort(sort).skip(skip).limit(limitNum).select("-testCases")

    // Get total count for pagination
    const totalProblems = await Problem.countDocuments(filter)
    const totalPages = Math.ceil(totalProblems / limitNum)

    // If user is authenticated, check which problems they've solved
    let solvedProblems = []
    if (req.user) {
      const user = await User.findById(req.user.id)
      if (user && user.solvedProblems) {
        solvedProblems = user.solvedProblems.map((sp) => sp.problemId.toString())
      }
    }

    // Add isSolved flag to each problem
    const problemsWithSolvedStatus = problems.map((problem) => ({
      ...problem.toObject(),
      isSolved: solvedProblems.includes(problem._id.toString()),
      trophyReward: TROPHY_REWARDS[problem.difficulty] || 0,
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
      if (user && user.solvedProblems) {
        isSolved = user.solvedProblems.some((sp) => sp.problemId.toString() === id)
      }
    }

    // Only show first 2 test cases as examples
    const publicTestCases = problem.testCases.slice(0, 2)

    res.json({
      success: true,
      problem: {
        ...problem.toObject(),
        testCases: publicTestCases,
        isSolved,
        trophyReward: TROPHY_REWARDS[problem.difficulty] || 0,
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

    // Use only the first test case for running (example)
    const testCase = problem.testCases[0]

    if (!testCase) {
      return res.status(400).json({
        success: false,
        message: "No test cases available",
      })
    }

    // Run the code directly
    const result = await runCode(code, language, testCase)

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

    // Update user record
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Initialize arrays and statistics if they don't exist
    if (!user.submissions) user.submissions = []
    if (!user.solvedProblems) user.solvedProblems = []
    if (!user.statistics) {
      user.statistics = {
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        easyProblemsSolved: 0,
        mediumProblemsSolved: 0,
        hardProblemsSolved: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalTrophiesEarned: 0,
        totalTrophiesLost: 0,
      }
    }

    // Create submission record
    const submission = {
      problemId: id,
      code,
      language,
      status: isCorrect ? "Accepted" : "Wrong Answer",
      submittedAt: new Date(),
      testResults: evaluation.results.map((r) => ({
        input: r.input,
        expectedOutput: r.expectedOutput,
        actualOutput: r.actualOutput,
        passed: r.passed,
        executionTime: r.executionTime,
      })),
    }

    user.submissions.push(submission)
    user.statistics.totalSubmissions += 1

    let trophiesEarned = 0

    if (isCorrect) {
      user.statistics.acceptedSubmissions += 1

      // Check if this is the first time solving this problem
      const alreadySolved = user.solvedProblems.some((sp) => sp.problemId.toString() === id)

      if (!alreadySolved) {
        // Award trophies based on difficulty
        trophiesEarned = TROPHY_REWARDS[problem.difficulty] || 0

        user.solvedProblems.push({
          problemId: id,
          solvedAt: new Date(),
          language,
          code,
          trophiesEarned,
        })

        // Add trophy history
        user.addTrophyHistory("earned", trophiesEarned, `Solved ${problem.difficulty} problem: ${problem.title}`, id)

        // Update difficulty-specific counters
        if (problem.difficulty === "Easy") {
          user.statistics.easyProblemsSolved += 1
        } else if (problem.difficulty === "Medium") {
          user.statistics.mediumProblemsSolved += 1
        } else if (problem.difficulty === "Hard") {
          user.statistics.hardProblemsSolved += 1
        }

        // Update streak
        const today = new Date()
        const lastSolved = user.statistics.lastSolvedDate

        if (lastSolved) {
          const daysDiff = Math.floor((today - lastSolved) / (1000 * 60 * 60 * 24))
          if (daysDiff === 0 || daysDiff === 1) {
            user.statistics.currentStreak += 1
          } else if (daysDiff > 1) {
            user.statistics.currentStreak = 1
          }
        } else {
          user.statistics.currentStreak = 1
        }

        user.statistics.longestStreak = Math.max(user.statistics.longestStreak, user.statistics.currentStreak)
        user.statistics.lastSolvedDate = today

        // Increment problem's solved count
        await Problem.findByIdAndUpdate(id, {
          $inc: { solvedCount: 1 },
        })
      }
    }

    await user.save()

    res.json({
      success: true,
      isCorrect,
      results: evaluation.results,
      trophiesEarned,
      message: isCorrect
        ? `Congratulations! Solution accepted. ${trophiesEarned > 0 ? `You earned ${trophiesEarned} trophies!` : ""}`
        : "Solution incorrect. Please try again.",
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
    const user = await User.findById(req.user.id).populate("solvedProblems.problemId")

    const stats = {
      totalSolved: user.solvedProblems.length,
      easySolved: user.statistics.easyProblemsSolved || 0,
      mediumSolved: user.statistics.mediumProblemsSolved || 0,
      hardSolved: user.statistics.hardProblemsSolved || 0,
      totalTrophies: user.trophies,
      trophiesEarned: user.statistics.totalTrophiesEarned || 0,
      currentStreak: user.statistics.currentStreak || 0,
      longestStreak: user.statistics.longestStreak || 0,
      recentlySolved: user.solvedProblems.sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt)).slice(0, 5),
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


// Get user's submissions for a problem
router.get("/problems/:id/submissions", authenticateToken, async (req, res) => {
  try {
    const problemId = req.params.id
    const userId = req.user._id

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const submissions =
      user.submissions && Array.isArray(user.submissions)
        ? user.submissions
            .filter((sub) => sub.problemId && sub.problemId.toString() === problemId)
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            .slice(0, 20) // Last 20 submissions
        : []

    res.json({ submissions })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})


module.exports = router
