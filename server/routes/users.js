const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Match = require("../models/Match")
const Problem = require("../models/Problem")
const { authenticateToken } = require("../middleware/auth")
const bcrypt = require("bcryptjs")

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      user,
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

// Get user dashboard data
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id

    // Get user with populated data
    const user = await User.findById(userId)
      .populate("solvedProblems.problemId", "title difficulty")
      .select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Get recent matches for win streak calculation
    const recentMatches = await Match.find({
      $or: [{ userA: userId }, { userB: userId }],
      status: "completed",
    })
      .sort({ endTime: -1 })
      .limit(20)
      .populate("userA userB", "username")
      .populate("winner", "username")
      .populate("problem", "title difficulty")

    // Calculate current win streak
    let currentWinStreak = 0
    for (const match of recentMatches) {
      if (match.winner && match.winner._id.toString() === userId.toString()) {
        currentWinStreak++
      } else {
        break
      }
    }

    // Get recent 5 matches for display
    const recentMatchesForDisplay = recentMatches.slice(0, 5).map((match) => {
      const isUserA = match.userA._id.toString() === userId.toString()
      const opponent = isUserA ? match.userB : match.userA
      const isWinner = match.winner && match.winner._id.toString() === userId.toString()
      const wasConceded = match.concedeBy
      const userConceded = match.concedeBy && match.concedeBy.toString() === userId.toString()

      let result = "draw"
      if (wasConceded) {
        result = userConceded ? "loss" : "win"
      } else if (match.winner) {
        result = isWinner ? "win" : "loss"
      }

      return {
        _id: match._id,
        opponent: {
          username: opponent.username,
          rating: opponent.trophies || 1200,
        },
        problem: {
          title: match.problem.title,
          difficulty: match.problem.difficulty,
        },
        result,
        date: match.endTime || match.createdAt,
        concedeBy: match.concedeBy ? match.concedeBy.toString() : null,
      }
    })

    // Calculate statistics
    const stats = {
      totalMatches: user.matchesPlayed || 0,
      wins: user.matchesWon || 0,
      losses: user.matchesLost || 0,
      winRate: user.matchesPlayed > 0 ? Math.round((user.matchesWon / user.matchesPlayed) * 100) : 0,
      currentWinStreak,
      trophies: user.trophies || 1200,
      totalProblemsSolved: user.solvedProblems.length,
      easyProblemsSolved: user.statistics?.easyProblemsSolved || 0,
      mediumProblemsSolved: user.statistics?.mediumProblemsSolved || 0,
      hardProblemsSolved: user.statistics?.hardProblemsSolved || 0,
      currentStreak: user.statistics?.currentStreak || 0,
      longestStreak: user.statistics?.longestStreak || 0,
    }

    // Get rating history for chart (last 10 matches)
    const ratingHistory = user.trophyHistory
      .filter((entry) => entry.matchId)
      .slice(-10)
      .map((entry, index) => ({
        match: index + 1,
        rating: entry.newRating || user.trophies,
        change: entry.action === "earned" ? entry.amount : -entry.amount,
        date: entry.date,
      }))

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        trophies: user.trophies,
        rating: user.trophies, // For compatibility
      },
      stats,
      recentMatches: recentMatchesForDisplay,
      ratingHistory,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: error.message,
    })
  }
})

// Get user's trophy history
router.get("/trophy-history", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("trophyHistory.problemId", "title difficulty")
      .populate("trophyHistory.matchId", "status")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Sort trophy history by date (newest first)
    const sortedHistory = user.trophyHistory.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Calculate stats
    const stats = {
      totalEarned: user.trophyHistory
        .filter((entry) => entry.action === "earned")
        .reduce((sum, entry) => sum + entry.amount, 0),
      totalLost: user.trophyHistory
        .filter((entry) => entry.action === "lost")
        .reduce((sum, entry) => sum + entry.amount, 0),
      transactionCount: user.trophyHistory.length,
      currentTrophies: user.trophies || 1200,
    }

    res.json({
      success: true,
      history: sortedHistory,
      stats,
    })
  } catch (error) {
    console.error("Error fetching trophy history:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching trophy history",
      error: error.message,
    })
  }
})

// Update user preferences
router.put("/preferences", authenticateToken, async (req, res) => {
  try {
    const { theme, language, fontSize, notifications } = req.body

    const user = await User.findById(req.user._id)
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
