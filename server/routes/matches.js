const express = require("express")
const Match = require("../models/Match")
const Problem = require("../models/Problem")
const User = require("../models/User")
const {authenticateToken} = require("../middleware/auth")
const { evaluateCode, runCode } = require("../utils/codeEvaluation")

const router = express.Router()

// Trophy rewards/penalties for duels
const DUEL_TROPHY_REWARDS = {
  win: 25,
  loss: -15,
  draw: 0,
}

// Get match details
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const match = await Match.findById(id)
      .populate("userA", "username trophies")
      .populate("userB", "username trophies")
      .populate("problem")

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    if (match.userA._id.toString() !== req.user.id && match.userB._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this match",
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

// Run code against a single test case in a match
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

    // Check if user is part of the match
    if (match.userA.toString() !== req.user.id && match.userB.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to run code in this match",
      })
    }

    // Use only the first test case for running (example)
    const testCase = match.problem.testCases[0]

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

// Submit solution in a match
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
    const match = await Match.findById(id).populate("problem")
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    if (match.userA.toString() !== req.user.id && match.userB.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to submit in this match",
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
    const userId = req.user.id
    const isUserA = match.userA.toString() === userId

    // Update match with submission
    const submissionData = {
      code,
      language,
      submittedAt: new Date(),
      isCorrect,
      testResults: evaluation.results,
      performance: evaluation.performance,
      executionTime: evaluation.avgExecutionTime,
      memoryUsed: evaluation.maxMemoryUsed,
    }

    if (isUserA) {
      match.userASubmission = submissionData
    } else {
      match.userBSubmission = submissionData
    }

    // If this is a correct solution, end the match
    if (isCorrect) {
      match.status = "completed"
      match.winner = userId
      match.endTime = new Date()

      // Update trophies for both users
      const winner = await User.findById(userId)
      const opponentId = isUserA ? match.userB : match.userA
      const loser = await User.findById(opponentId)

      if (winner && loser) {
        // Winner gains trophies
        winner.addTrophyHistory("earned", DUEL_TROPHY_REWARDS.win, `Won duel against ${loser.username}`, null, id)
        winner.matchesWon += 1
        winner.matchesPlayed += 1

        // Loser loses trophies
        loser.addTrophyHistory("lost", Math.abs(DUEL_TROPHY_REWARDS.loss), `Lost duel to ${winner.username}`, null, id)
        loser.matchesLost += 1
        loser.matchesPlayed += 1

        await Promise.all([winner.save(), loser.save()])
      }

      await match.save()

      return res.json({
        success: true,
        isCorrect: true,
        match: match.toObject(),
        evaluation,
        message: "Congratulations! You won the duel!",
        trophyChange: DUEL_TROPHY_REWARDS.win,
      })
    }

    await match.save()

    res.json({
      success: true,
      isCorrect: false,
      evaluation,
      message: "Solution incorrect. Keep trying!",
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

// Concede match
router.post("/:id/concede", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Find the match
    const match = await Match.findById(id)
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    if (match.userA.toString() !== req.user.id && match.userB.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to concede this match",
      })
    }

    // Check if match is active
    if (match.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Match is not active",
      })
    }

    const userId = req.user.id
    const isUserA = match.userA.toString() === userId
    const winnerId = isUserA ? match.userB : match.userA

    // Update match
    match.status = "completed"
    match.winner = winnerId
    match.endTime = new Date()
    match.concedeBy = userId

    // Update trophies for both users
    const winner = await User.findById(winnerId)
    const loser = await User.findById(userId)

    if (winner && loser) {
      // Winner gains trophies
      winner.addTrophyHistory(
        "earned",
        DUEL_TROPHY_REWARDS.win,
        `Won duel against ${loser.username} (opponent conceded)`,
        null,
        id,
      )
      winner.matchesWon += 1
      winner.matchesPlayed += 1

      // Loser loses trophies
      loser.addTrophyHistory(
        "lost",
        Math.abs(DUEL_TROPHY_REWARDS.loss),
        `Lost duel to ${winner.username} (conceded)`,
        null,
        id,
      )
      loser.matchesLost += 1
      loser.matchesPlayed += 1

      await Promise.all([winner.save(), loser.save()])
    }

    await match.save()

    res.json({
      success: true,
      message: "Match conceded successfully",
      match: match.toObject(),
      trophyChange: DUEL_TROPHY_REWARDS.loss,
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

module.exports = router
