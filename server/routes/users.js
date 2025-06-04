const express = require("express")
const User = require("../models/User")
const Match = require("../models/Match")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get user profile with enhanced statistics
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("solvedProblems.problemId", "title difficulty")
      .select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Calculate win rate
    const winRate = user.matchesPlayed > 0 ? Math.round((user.matchesWon / user.matchesPlayed) * 100) : 0

    // Get recent matches for win streak calculation
    const recentMatches = await Match.find({
      $or: [{ userA: user._id }, { userB: user._id }],
      status: "completed",
    })
      .sort({ endTime: -1 })
      .limit(20)
      .populate("winner", "username")

    // Calculate current win streak
    let currentWinStreak = 0
    for (const match of recentMatches) {
      if (match.winner && match.winner._id.toString() === user._id.toString()) {
        currentWinStreak++
      } else {
        break
      }
    }

    // Calculate rating history for chart
    const ratingHistory = user.trophyHistory
      .filter((entry) => entry.matchId) // Only match-related trophy changes
      .slice(-10) // Last 10 matches
      .map((entry, index) => ({
        match: index + 1,
        rating: entry.amount,
        date: entry.date,
      }))

    const userStats = {
      user: {
        ...user.toObject(),
        currentWinStreak,
      },
      stats: {
        matchesPlayed: user.matchesPlayed,
        matchesWon: user.matchesWon,
        matchesLost: user.matchesLost,
        winRate,
        currentWinStreak,
        ratingHistory,
        totalProblemsSolved: user.solvedProblems.length,
        easyProblemsSolved: user.statistics?.easyProblemsSolved || 0,
        mediumProblemsSolved: user.statistics?.mediumProblemsSolved || 0,
        hardProblemsSolved: user.statistics?.hardProblemsSolved || 0,
        currentStreak: user.statistics?.currentStreak || 0,
        longestStreak: user.statistics?.longestStreak || 0,
      },
    }

    res.json({
      success: true,
      ...userStats,
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: error.message,
    })
  }
})

// Get user's recent matches
router.get("/:id/recent-matches", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { limit = 5 } = req.query

    // Validate that user can only access their own matches or is admin
    if (id !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these matches",
      })
    }

    const matches = await Match.find({
      $or: [{ userA: id }, { userB: id }],
      status: "completed",
    })
      .sort({ endTime: -1 })
      .limit(Number.parseInt(limit))
      .populate("userA userB", "username trophies")
      .populate("winner", "username")
      .populate("problem", "title difficulty")

    const formattedMatches = matches.map((match) => {
      const isUserA = match.userA._id.toString() === id
      const opponent = isUserA ? match.userB : match.userA
      const isWinner = match.winner && match.winner._id.toString() === id

      // Calculate trophy change from match
      let trophyChange = 0
      const user = isUserA ? match.userA : match.userB

      // Find trophy change in user's history for this match
      User.findById(id).then((userData) => {
        const trophyEntry = userData.trophyHistory.find(
          (entry) => entry.matchId && entry.matchId.toString() === match._id.toString(),
        )
        if (trophyEntry) {
          trophyChange = trophyEntry.action === "earned" ? trophyEntry.amount : -trophyEntry.amount
        }
      })

      return {
        id: match._id,
        date: match.endTime,
        opponent: {
          username: opponent.username,
          rating: opponent.trophies,
        },
        problem: {
          title: match.problem.title,
          difficulty: match.problem.difficulty,
        },
        result: isWinner ? "win" : "loss",
        ratingChange: trophyChange,
        concedeBy: match.concedeBy ? match.concedeBy.toString() : null,
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

// Update user preferences
router.put("/preferences", authenticateToken, async (req, res) => {
  try {
    const { theme, language, fontSize, notifications } = req.body

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Update preferences
    if (theme) user.preferences.theme = theme
    if (language) user.preferences.language = language
    if (fontSize) user.preferences.fontSize = fontSize
    if (notifications) user.preferences.notifications = { ...user.preferences.notifications, ...notifications }

    await user.save()

    res.json({
      success: true,
      message: "Preferences updated successfully",
      preferences: user.preferences,
    })
  } catch (error) {
    console.error("Error updating preferences:", error)
    res.status(500).json({
      success: false,
      message: "Error updating preferences",
      error: error.message,
    })
  }
})

module.exports = router
