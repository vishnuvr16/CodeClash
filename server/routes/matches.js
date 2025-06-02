const express = require("express")
const router = express.Router()
const Match = require("../models/Match")
const User = require("../models/User")
const Problem = require("../models/Problem")
const { evaluateCode, runCode } = require("../utils/codeEvaluation")
const { authenticateToken } = require("../middleware/auth")

// Trophy rewards/penalties for duels
const DUEL_TROPHY_REWARDS = {
  win: 25,
  loss: -15,
  draw: 0,
}

// Get match details
router.get("/:matchId", authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params
    const userId = req.user.id

    const match = await Match.findById(matchId)
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
    if (match.userA._id.toString() !== userId && match.userB._id.toString() !== userId) {
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

// Run code against a test case in a match
router.post("/:matchId/run", authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params
    const { code, language, testCaseIndex = 0 } = req.body
    const userId = req.user.id

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "Code and language are required",
      })
    }

    // Find the match
    const match = await Match.findById(matchId).populate("problem")
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    if (match.userA.toString() !== userId && match.userB.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to run code in this match",
      })
    }

    // Check if match is active
    if (match.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Match is not active",
      })
    }

    // Get the test case (use first public test case)
    const publicTestCases = match.problem.testCases.filter((tc) => !tc.isHidden)
    const testCase = publicTestCases[0]

    if (!testCase) {
      return res.status(400).json({
        success: false,
        message: "No test cases available",
      })
    }

    // Run the code with problem-specific driver
    const result = await runCode(code, language, match.problem, testCase)

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
router.post("/:matchId/submit", authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params
    const { code, language } = req.body
    const userId = req.user.id

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "Code and language are required",
      })
    }

    // Find the match
    const match = await Match.findById(matchId).populate("problem")
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    if (match.userA.toString() !== userId && match.userB.toString() !== userId) {
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

    // Evaluate code against all test cases with problem-specific driver
    const evaluation = await evaluateCode(code, language, match.problem, match.problem.testCases)

    if (!evaluation.success) {
      return res.status(400).json({
        success: false,
        message: evaluation.error || "Code evaluation failed",
      })
    }

    const isCorrect = evaluation.allPassed

    if (isCorrect) {
      // User solved the problem - they win the match
      const winnerId = userId
      const loserId = match.userA.toString() === userId ? match.userB.toString() : match.userA.toString()

      // Update match
      match.status = "completed"
      match.winner = winnerId
      match.endTime = new Date()
      await match.save()

      // Update user statistics and trophies
      const winner = await User.findById(winnerId)
      const loser = await User.findById(loserId)

      if (winner && loser) {
        // Winner gains trophies
        winner.addTrophyHistory("earned", DUEL_TROPHY_REWARDS.win, `Won duel against ${loser.username}`, null, matchId)
        winner.matchesWon += 1
        winner.matchesPlayed += 1

        // Loser loses trophies
        loser.addTrophyHistory(
          "lost",
          Math.abs(DUEL_TROPHY_REWARDS.loss),
          `Lost duel to ${winner.username}`,
          null,
          matchId,
        )
        loser.matchesLost += 1
        loser.matchesPlayed += 1

        await Promise.all([winner.save(), loser.save()])
      }

      res.json({
        success: true,
        isCorrect: true,
        match: match.toObject(),
        trophiesEarned: DUEL_TROPHY_REWARDS.win,
        message: `Congratulations! You solved the problem and won the duel! You earned ${DUEL_TROPHY_REWARDS.win} trophies!`,
      })
    } else {
      // Solution is incorrect
      res.json({
        success: true,
        isCorrect: false,
        results: evaluation.results,
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

// Concede a match
router.post("/:matchId/concede", authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params
    const userId = req.user.id

    // Find the match
    const match = await Match.findById(matchId)
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    if (match.userA.toString() !== userId && match.userB.toString() !== userId) {
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

    // Set opponent as winner
    const isUserA = match.userA.toString() === userId
    const winnerId = isUserA ? match.userB.toString() : match.userA.toString()
    const loserId = userId

    // Update match
    match.status = "completed"
    match.winner = winnerId
    match.endTime = new Date()
    match.concedeBy = userId
    await match.save()

    // Update user statistics and trophies
    const winner = await User.findById(winnerId)
    const loser = await User.findById(loserId)

    if (winner && loser) {
      // Winner gains trophies
      winner.addTrophyHistory(
        "earned",
        DUEL_TROPHY_REWARDS.win,
        `Won duel (opponent conceded): ${loser.username}`,
        null,
        matchId,
      )
      winner.matchesWon += 1
      winner.matchesPlayed += 1

      // Loser loses trophies
      loser.addTrophyHistory(
        "lost",
        Math.abs(DUEL_TROPHY_REWARDS.loss),
        `Conceded duel to ${winner.username}`,
        null,
        matchId,
      )
      loser.matchesLost += 1
      loser.matchesPlayed += 1

      await Promise.all([winner.save(), loser.save()])
    }

    res.json({
      success: true,
      message: "Match conceded successfully",
      match: match.toObject(),
      trophiesLost: Math.abs(DUEL_TROPHY_REWARDS.loss),
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
