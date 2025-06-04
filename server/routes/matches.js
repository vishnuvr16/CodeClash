const express = require("express")
const Match = require("../models/Match")
const Problem = require("../models/Problem")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")
const { evaluateCode, runCode } = require("../utils/codeEvaluation")

const router = express.Router()

// Trophy rewards/penalties for duels
const DUEL_TROPHY_REWARDS = {
  win: 25,
  loss: -15,
  draw: 0,
}

// Get match details with access control
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid match ID format",
      })
    }

    const match = await Match.findById(id)
      .populate("userA", "username trophies email")
      .populate("userB", "username trophies email")
      .populate("problem")
      .populate("winner", "username")
      .populate("concedeBy", "username")

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    if (
      match.userA._id.toString() !== req.user._id.toString() &&
      match.userB._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this match",
      })
    }

    // If match is completed, don't allow access to duel page
    if (match.status === "completed") {
      return res.status(410).json({
        success: false,
        message: "Match has already been completed",
        redirectTo: `/result/${id}`,
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

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid match ID format",
      })
    }

    // Find the match
    const match = await Match.findById(id).populate("problem").populate("userA userB", "username email trophies")
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    if (
      match.userA._id.toString() !== req.user._id.toString() &&
      match.userB._id.toString() !== req.user._id.toString()
    ) {
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
    const userId = req.user._id
    const isUserA = match.userA._id.toString() === userId.toString()

    // Create submission object
    const submission = {
      user: userId,
      code,
      language,
      isCorrect,
      isSubmitted: true,
      timeTaken: Math.floor((new Date() - match.startTime) / 1000),
      submittedAt: new Date(),
      updatedAt: new Date(),
    }

    // Add submission to match
    match.submissions.push(submission)

    // If this is a correct solution, end the match immediately
    if (isCorrect) {
      match.status = "completed"
      match.winner = userId
      match.endTime = new Date()

      // Update trophies and match statistics
      const winner = await User.findById(userId)
      const opponentId = isUserA ? match.userB._id : match.userA._id
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
        redirectTo: `/result/${id}`,
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

// Concede match - ends match immediately for both parties
router.post("/:id/concede", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid match ID format",
      })
    }

    // Find the match
    const match = await Match.findById(id).populate("userA userB", "username email trophies")
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    if (
      match.userA._id.toString() !== req.user._id.toString() &&
      match.userB._id.toString() !== req.user._id.toString()
    ) {
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

    const userId = req.user._id
    const isUserA = match.userA._id.toString() === userId.toString()
    const winnerId = isUserA ? match.userB._id : match.userA._id

    // Update match - END IMMEDIATELY
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
      redirectTo: `/result/${id}`,
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

// Handle user disconnection/tab navigation (called by client)
router.post("/:id/disconnect", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid match ID format",
      })
    }

    const match = await Match.findById(id).populate("userA userB", "username email trophies")
    if (!match || match.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Match not found or not active",
      })
    }

    const userId = req.user._id
    const isUserA = match.userA._id.toString() === userId.toString()
    const winnerId = isUserA ? match.userB._id : match.userA._id

    // End match due to disconnection
    match.status = "completed"
    match.winner = winnerId
    match.endTime = new Date()
    match.concedeBy = userId

    // Update trophies
    const winner = await User.findById(winnerId)
    const loser = await User.findById(userId)

    if (winner && loser) {
      winner.addTrophyHistory(
        "earned",
        DUEL_TROPHY_REWARDS.win,
        `Won duel against ${loser.username} (opponent disconnected)`,
        null,
        id,
      )
      winner.matchesWon += 1
      winner.matchesPlayed += 1

      loser.addTrophyHistory(
        "lost",
        Math.abs(DUEL_TROPHY_REWARDS.loss),
        `Lost duel to ${winner.username} (disconnected)`,
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
      message: "Match ended due to disconnection",
      redirectTo: `/result/${id}`,
    })
  } catch (error) {
    console.error("Error handling disconnection:", error)
    res.status(500).json({
      success: false,
      message: "Error handling disconnection",
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

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid match ID format",
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
    if (match.userA.toString() !== req.user._id.toString() && match.userB.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to run code in this match",
      })
    }

    // Check if match is still active
    if (match.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Match is not active",
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

// Get user's match history
router.get("/user/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id
    const { page = 1, limit = 10, result } = req.query

    // Build query
    const query = {
      $or: [{ userA: userId }, { userB: userId }],
      status: "completed",
    }

    // Filter by result if specified
    if (result && result !== "all") {
      if (result === "wins") {
        query.winner = userId
      } else if (result === "losses") {
        query.$and = [
          { winner: { $ne: userId } },
          { winner: { $ne: null } }, // Exclude draws
        ]
      }
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get matches with populated data
    const matches = await Match.find(query)
      .sort({ endTime: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .populate("userA userB", "username trophies")
      .populate("winner", "username")
      .populate("problem", "title difficulty")
      .populate("concedeBy", "username")

    const totalMatches = await Match.countDocuments(query)
    const totalPages = Math.ceil(totalMatches / Number.parseInt(limit))

    // Format matches for frontend
    const formattedMatches = matches.map((match) => {
      const isUserA = match.userA._id.toString() === userId.toString()
      const opponent = isUserA ? match.userB : match.userA
      const isWinner = match.winner && match.winner._id.toString() === userId.toString()
      const wasConceded = match.concedeBy
      const userConceded = match.concedeBy && match.concedeBy._id.toString() === userId.toString()

      // Determine result
      let result = "draw"
      if (wasConceded) {
        result = userConceded ? "loss" : "win"
      } else if (match.winner) {
        result = isWinner ? "win" : "loss"
      }

      // Calculate rating change
      let ratingChange = 0
      if (isUserA && match.ratingChangeA !== undefined) {
        ratingChange = match.ratingChangeA
      } else if (!isUserA && match.ratingChangeB !== undefined) {
        ratingChange = match.ratingChangeB
      }

      return {
        _id: match._id,
        date: match.endTime || match.createdAt,
        createdAt: match.createdAt,
        opponent: {
          _id: opponent._id,
          username: opponent.username,
          rating: opponent.trophies || 1200,
        },
        problem: {
          title: match.problem.title,
          difficulty: match.problem.difficulty,
        },
        result,
        ratingChange,
        concedeBy: match.concedeBy ? { _id: match.concedeBy._id } : null,
        userA: match.userA,
        userB: match.userB,
        winner: match.winner,
        ratingChangeA: match.ratingChangeA,
        ratingChangeB: match.ratingChangeB,
      }
    })

    res.json({
      success: true,
      matches: formattedMatches,
      currentPage: Number.parseInt(page),
      totalPages,
      totalMatches,
      hasNextPage: Number.parseInt(page) < totalPages,
      hasPrevPage: Number.parseInt(page) > 1,
    })
  } catch (error) {
    console.error("Error fetching match history:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching match history",
      error: error.message,
    })
  }
})

module.exports = router
