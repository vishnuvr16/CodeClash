const express = require("express")
const router = express.Router()
const Match = require("../models/Match")
const User = require("../models/User")
const Problem = require("../models/Problem")
const { evaluateCode, runCode } = require("../utils/codeEvaluation")
const { updateRating } = require("../utils/ratingSystem")
const { authenticateToken } = require("../middleware/auth")
// Get match details
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const match = await Match.findById(id)
      .populate("userA", "username rating")
      .populate("userB", "username rating")
      .populate("problem")

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }
    

    // Check if user is part of this match
    const userId = req.user.id
    if (match.userA._id.toString() !== userId && match.userB._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      ...match.toObject(),
    })
  } catch (error) {
    console.error("Error fetching match:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching match",
      error: error.message,
    })
  }
})

// Run code against a test case
router.post("/:id/run", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { code, language, testCaseIndex = 0 } = req.body

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "Code and language are required",
      })
    }

    // Find the match
    const match = await Match.findById(id).populate("problem")
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    // Check if user is part of this match
    const userId = req.user.id
    if (match.userA.toString() !== userId && match.userB.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Check if match is active
    if (match.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Match is not active",
      })
    }

    // Get the test case (use public test cases only for running)
    const publicTestCases = match.problem.testCases.filter((tc) => !tc.isHidden)

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

// Submit solution
router.post("/:id/submit", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { code, language } = req.body

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "Code and language are required",
      })
    }

    // Find the match
    const match = await Match.findById(id).populate("problem userA userB")
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    // Check if user is part of this match
    const userId = req.user.id
    if (match.userA._id.toString() !== userId && match.userB._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Check if match is active
    if (match.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Match is not active",
      })
    }

    // Evaluate code against all test cases
    const evaluation = await evaluateCode(code, language, match.problem.testCases)

    if (!evaluation.success) {
      return res.status(400).json({
        success: false,
        message: evaluation.error || "Code evaluation failed",
      })
    }

    const isCorrect = evaluation.allPassed

    if (isCorrect) {
      // User solved the problem - they win!
      match.status = "completed"
      match.winner = userId
      match.endTime = new Date()
      match.solution = {
        userId,
        code,
        language,
        submittedAt: new Date(),
      }

      await match.save()

      // Update ratings
      const isUserA = match.userA._id.toString() === userId
      const winner = isUserA ? match.userA : match.userB
      const loser = isUserA ? match.userB : match.userA

      await updateRating(winner._id, loser._id, "win")

      // Update user statistics
      await Promise.all([
        User.findByIdAndUpdate(winner._id, {
          $inc: {
            matchesPlayed: 1,
            matchesWon: 1,
            totalRatingGained: 25, // Simplified rating gain
          },
          $push: { matchHistory: match._id },
        }),
        User.findByIdAndUpdate(loser._id, {
          $inc: {
            matchesPlayed: 1,
            matchesLost: 1,
            totalRatingLost: 25, // Simplified rating loss
          },
          $push: { matchHistory: match._id },
        }),
      ])

      res.json({
        success: true,
        isCorrect: true,
        match: await Match.findById(id).populate("userA userB problem"),
        message: "Congratulations! You won the match!",
      })
    } else {
      res.json({
        success: true,
        isCorrect: false,
        evaluation,
        message: "Solution incorrect. Keep trying!",
      })
    }
  } catch (error) {
    console.error("Error submitting solution:", error)
    res.status(500).json({
      success: false,
      message: "Error submitting solution",
      error: error.message,
    })
  }
})

// Concede match
router.post("/:id/concede", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Find the match
    const match = await Match.findById(id).populate("userA userB")
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    // Check if user is part of this match
    if (match.userA._id.toString() !== userId && match.userB._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Check if match is active
    if (match.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Match is not active",
      })
    }

    // Determine winner and loser
    const isUserA = match.userA._id.toString() === userId
    const loser = isUserA ? match.userA : match.userB
    const winner = isUserA ? match.userB : match.userA

    // Update match
    match.status = "completed"
    match.winner = winner._id
    match.endTime = new Date()
    match.concedeBy = userId
    match.endReason = "concede"

    await match.save()

    // Update ratings
    await updateRating(winner._id, loser._id, "win")

    // Update user statistics
    await Promise.all([
      User.findByIdAndUpdate(winner._id, {
        $inc: {
          matchesPlayed: 1,
          matchesWon: 1,
          totalRatingGained: 25,
        },
        $push: { matchHistory: match._id },
      }),
      User.findByIdAndUpdate(loser._id, {
        $inc: {
          matchesPlayed: 1,
          matchesLost: 1,
          totalRatingLost: 25,
        },
        $push: { matchHistory: match._id },
      }),
    ])

    res.json({
      success: true,
      match: await Match.findById(id).populate("userA userB problem winner", "username rating title"),
      message: "Match conceded successfully",
    })
  } catch (error) {
    console.error("Error conceding match:", error)
    res.status(500).json({
      success: false,
      message: "Error conceding match",
      error: error.message,
    })
  }
})

// Get user's recent matches
router.get("/user/:userId/recent", async (req, res) => {
  try {
    const { userId } = req.params
    const { limit = 10 } = req.query

    const matches = await Match.find({
      $or: [{ userA: userId }, { userB: userId }],
      status: "completed",
    })
      .populate("userA userB problem winner", "username rating title")
      .sort({ endTime: -1 })
      .limit(Number.parseInt(limit))
      .lean()

    // Format matches for response
    const formattedMatches = matches.map((match) => {
      const isUserA = match.userA._id.toString() === userId
      const opponent = isUserA ? match.userB : match.userA
      const userWon = match.winner && match.winner._id.toString() === userId

      return {
        id: match._id,
        opponent: {
          username: opponent.username,
          rating: opponent.rating,
        },
        problem: {
          title: match.problem.title,
        },
        result: userWon ? "win" : "loss",
        date: match.endTime,
        ratingChange: userWon ? 25 : -25, // Simplified rating change
        endReason: match.endReason || "solution",
        concedeBy: match.concedeBy,
      }
    })

    res.json({
      success: true,
      matches: formattedMatches,
    })
  } catch (error) {
    console.error("Error fetching recent matches:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching recent matches",
      error: error.message,
    })
  }
})

module.exports = router
