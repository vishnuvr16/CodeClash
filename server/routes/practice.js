const express = require("express")
const Problem = require("../models/Problem")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")
const { executeCode } = require("../utils/codeEvaluation")

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
      const user = await User.findById(req.user.id).select("solvedProblems")
      solvedProblems = user.solvedProblems.map((sp) => sp.problemId.toString())
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
    res.status(500).json({ message: "Server error" })
  }
})

// Get available tags
router.get("/tags", async (req, res) => {
  try {
    const tags = await Problem.distinct("tags")
    res.json({ tags })
  } catch (error) {
    console.error("Error fetching tags:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get a single problem for practice
router.get("/problems/:id",authenticateToken, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      })
    }

    console.log("pr",req.user._id);

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
    console.log("id",req.user);
    console.error("Error fetching problem:", error)
    res.status(500).json({
      message: "Server error while fetching problem",
    })
  }
})

// Run code for a practice problem
router.post("/problems/:id/run", authenticateToken, async (req, res) => {
  try {
    const { code, language, testCaseIndex = 0 } = req.body
    const problemId = req.params.id

    const problem = await Problem.findById(problemId)
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" })
    }

    // Get the specific test case (only visible ones)
    const visibleTestCases = problem.testCases.filter((tc) => !tc.hidden)
    const testCase = visibleTestCases[testCaseIndex]

    if (!testCase) {
      return res.status(400).json({ message: "Invalid test case index" })
    }

    // Execute code
    const result = await executeCode(code, language, [testCase])

    res.json({ result: result[0] })
  } catch (error) {
    console.error("Error running code:", error)
    res.status(500).json({ message: "Code execution failed" })
  }
})

// Submit solution for a practice problem
router.post("/problems/:id/submit", authenticateToken, async (req, res) => {
  try {
    const { code, language } = req.body
    const problemId = req.params.id
    const userId = req.user.id

    const problem = await Problem.findById(problemId)
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" })
    }

    // Evaluate code against all test cases
    const results = await executeCode(code, language, problem.testCases)

    // Check if all test cases passed
    const allPassed = results.every((result) => result.passed)
    const passedCount = results.filter((result) => result.passed).length

    // Determine status
    let status = "Wrong Answer"
    if (allPassed) {
      status = "Accepted"
    } else if (results.some((r) => r.stderr)) {
      status = "Runtime Error"
    } else if (results.some((r) => r.statusId === 5)) {
      // Time Limit Exceeded
      status = "Time Limit Exceeded"
    }

    // Calculate execution time and memory
    const avgExecutionTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length
    const maxMemoryUsed = Math.max(...results.map((r) => r.memoryUsed || 0))

    // Create submission record
    const submission = {
      problemId,
      code,
      language,
      status,
      submittedAt: new Date(),
      executionTime: avgExecutionTime,
      memoryUsed: maxMemoryUsed,
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
    user.submissions.push(submission)
    user.statistics.totalSubmissions += 1

    if (allPassed) {
      user.statistics.acceptedSubmissions += 1

      // Check if this is the first time solving this problem
      const alreadySolved = user.solvedProblems.some((sp) => sp.problemId.toString() === problemId)

      if (!alreadySolved) {
        user.solvedProblems.push({
          problemId,
          solvedAt: new Date(),
          language,
          code,
          executionTime: avgExecutionTime,
          memoryUsed: maxMemoryUsed,
        })

        // Update difficulty-specific counters
        switch (problem.difficulty) {
          case "Easy":
            user.statistics.easyProblemsSolved += 1
            break
          case "Medium":
            user.statistics.mediumProblemsSolved += 1
            break
          case "Hard":
            user.statistics.hardProblemsSolved += 1
            break
        }

        // Update streak
        const today = new Date()
        const lastSolved = user.statistics.lastSolvedDate

        if (lastSolved) {
          const daysDiff = Math.floor((today - lastSolved) / (1000 * 60 * 60 * 24))
          if (daysDiff === 1) {
            user.statistics.currentStreak += 1
          } else if (daysDiff > 1) {
            user.statistics.currentStreak = 1
          }
        } else {
          user.statistics.currentStreak = 1
        }

        user.statistics.longestStreak = Math.max(user.statistics.longestStreak, user.statistics.currentStreak)
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
      status,
      passedCount,
      totalCount: results.length,
      results: results.map((r) => ({
        ...r,
        input: r.input,
        expectedOutput: r.expectedOutput,
        actualOutput: r.actualOutput,
      })),
      executionTime: avgExecutionTime,
      memoryUsed: maxMemoryUsed,
    })
  } catch (error) {
    console.error("Error submitting solution:", error)
    res.status(500).json({ message: "Submission failed" })
  }
})

// Get user's submissions for a problem
router.get("/problems/:id/submissions", authenticateToken, async (req, res) => {
  try {
    const problemId = req.params.id
    const userId = req.user.id

    const user = await User.findById(userId).select("submissions")
    const submissions = user.submissions
      .filter((sub) => sub.problemId.toString() === problemId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 20) // Last 20 submissions

    res.json({ submissions })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get user's overall statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId).select("statistics solvedProblems")

    const stats = {
      ...user.statistics.toObject(),
      totalSolved: user.solvedProblems.length,
      acceptanceRate:
        user.statistics.totalSubmissions > 0
          ? Math.round((user.statistics.acceptedSubmissions / user.statistics.totalSubmissions) * 100)
          : 0,
    }

    res.json({ stats })
  } catch (error) {
    console.error("Error fetching stats:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
