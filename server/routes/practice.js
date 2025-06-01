const express = require("express")
const Problem = require("../models/Problem")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")
const { evaluateCode, runCode } = require("../utils/codeEvaluation")

const router = express.Router()

// Get all problems with pagination and filters
router.get("/problems", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, difficulty, tags, search, sortBy = "createdAt", order = "desc" } = req.query

    // Build query
    const query = {}

    if (difficulty && difficulty !== "all") {
      query.difficulty = difficulty
    }

    if (tags && tags !== "all") {
      query.tags = { $in: [tags] }
    }

    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Build sort object
    const sort = {}
    sort[sortBy] = order === "asc" ? 1 : -1

    // Execute query with pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
    const problems = await Problem.find(query).sort(sort).skip(skip).limit(Number.parseInt(limit)).select("-testCases") // Don't send test cases to client

    // Get total count for pagination
    const totalProblems = await Problem.countDocuments(query)
    const totalPages = Math.ceil(totalProblems / Number.parseInt(limit))

    // If user is authenticated, check which problems they've solved
    let solvedProblems = []
    if (req.user) {
      const user = await User.findById(req.user._id).select("solvedProblems")
      if (user && user.solvedProblems) {
        solvedProblems = user.solvedProblems.map((sp) => (sp.problemId ? sp.problemId.toString() : ""))
      }
    }

    // Add solved status to problems
    const problemsWithStatus = problems.map((problem) => ({
      ...problem.toObject(),
      isSolved: solvedProblems.includes(problem._id.toString()),
    }))

    res.json({
      problems: problemsWithStatus,
      currentPage: Number.parseInt(page),
      totalPages,
      totalProblems,
    })
  } catch (error) {
    console.error("Error fetching problems:", error)
    res.status(500).json({ message: "Server error", error: error.message })
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
    let isSolved = false
    let submissions = []

    if (req.user) {
      const user = await User.findById(req.user._id)

      if (user) {
        // Check if problem is solved
        if (user.solvedProblems && Array.isArray(user.solvedProblems)) {
          isSolved = user.solvedProblems.some((sp) => sp.problemId && sp.problemId.toString() === req.params.id)
        }

        // Get submissions
        if (user.submissions && Array.isArray(user.submissions)) {
          submissions = user.submissions.filter((sub) => sub.problemId && sub.problemId.toString() === req.params.id)
        }
      }
    }

    res.status(200).json({
      problem,
      isSolved,
      submissions,
    })
  } catch (error) {
    console.error("Error fetching problem:", error)
    res.status(500).json({
      message: "Server error while fetching problem",
      error: error.message,
    })
  }
})

// Run code for a practice problem
router.post("/problems/:id/run", authenticateToken, async (req, res) => {
  try {
    const { code, language, testCaseIndex = 0 } = req.body
    const problemId = req.params.id

    if (!code) {
      return res.status(400).json({ message: "Code is required" })
    }

    if (!language) {
      return res.status(400).json({ message: "Language is required" })
    }

    const problem = await Problem.findById(problemId)
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" })
    }

    // Get the specific test case (only visible ones)
    const visibleTestCases = problem.testCases.filter((tc) => !tc.hidden)

    if (visibleTestCases.length === 0) {
      return res.status(400).json({ message: "No visible test cases available" })
    }

    const testCase = visibleTestCases[testCaseIndex] || visibleTestCases[0]

    // Execute code
    const result = await runCode(code, language, testCase)

    if (!result.success) {
      return res.status(400).json({
        message: "Code execution failed",
        error: result.error,
      })
    }

    res.json({ result: result.result })
  } catch (error) {
    console.error("Error running code:", error)
    res.status(500).json({
      message: "Code execution failed",
      error: error.message,
    })
  }
})

// Submit solution for a practice problem
router.post("/problems/:id/submit", authenticateToken, async (req, res) => {
  try {
    const { code, language } = req.body
    const problemId = req.params.id
    const userId = req.user._id

    if (!code) {
      return res.status(400).json({ message: "Code is required" })
    }

    if (!language) {
      return res.status(400).json({ message: "Language is required" })
    }

    const problem = await Problem.findById(problemId)
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" })
    }

    // Evaluate code against all test cases
    const evaluation = await evaluateCode(code, language, problem.testCases)

    if (!evaluation.success) {
      return res.status(400).json({
        message: "Code evaluation failed",
        error: evaluation.error,
      })
    }

    const allPassed = evaluation.allPassed
    const results = evaluation.results

    // Create submission record
    const submission = {
      problemId,
      code,
      language,
      status: allPassed ? "Accepted" : "Wrong Answer",
      submittedAt: new Date(),
      testResults: results.map((r) => ({
        input: r.input,
        expectedOutput: r.expectedOutput,
        actualOutput: r.actualOutput,
        passed: r.passed,
        executionTime: r.executionTime,
      })),
    }

    // Update user record
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
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
      }
    }

    user.submissions.push(submission)
    user.statistics.totalSubmissions += 1

    if (allPassed) {
      user.statistics.acceptedSubmissions += 1

      // Check if this is the first time solving this problem
      const alreadySolved = user.solvedProblems.some((sp) => sp.problemId && sp.problemId.toString() === problemId)

      if (!alreadySolved) {
        user.solvedProblems.push({
          problemId,
          solvedAt: new Date(),
          language,
          code,
        })

        // Update difficulty-specific counters
        if (problem.difficulty === "Easy") {
          user.statistics.easyProblemsSolved = (user.statistics.easyProblemsSolved || 0) + 1
        } else if (problem.difficulty === "Medium") {
          user.statistics.mediumProblemsSolved = (user.statistics.mediumProblemsSolved || 0) + 1
        } else if (problem.difficulty === "Hard") {
          user.statistics.hardProblemsSolved = (user.statistics.hardProblemsSolved || 0) + 1
        }

        // Update streak
        const today = new Date()
        const lastSolved = user.statistics.lastSolvedDate

        if (lastSolved) {
          const daysDiff = Math.floor((today - lastSolved) / (1000 * 60 * 60 * 24))
          if (daysDiff === 0 || daysDiff === 1) {
            user.statistics.currentStreak = (user.statistics.currentStreak || 0) + 1
          } else if (daysDiff > 1) {
            user.statistics.currentStreak = 1
          }
        } else {
          user.statistics.currentStreak = 1
        }

        user.statistics.longestStreak = Math.max(user.statistics.longestStreak || 0, user.statistics.currentStreak || 0)
        user.statistics.lastSolvedDate = today
      }
    }

    await user.save()

    // Update problem statistics
    if (allPassed) {
      await Problem.findByIdAndUpdate(problemId, {
        $inc: { solvedCount: 1 },
      })
    }

    res.json({
      isCorrect: allPassed,
      status: allPassed ? "Accepted" : "Wrong Answer",
      passedCount: results.filter((r) => r.passed).length,
      totalCount: results.length,
      results,
    })
  } catch (error) {
    console.error("Error submitting solution:", error)
    res.status(500).json({
      message: "Submission failed",
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
