const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const Match = require("../models/Match")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      user,
      stats: {
        matchesPlayed: user.matchesPlayed,
        matchesWon: user.matchesWon,
        matchesLost: user.matchesLost,
        winRate: user.winRate,
        trophies: user.trophies,
        totalProblemsSolved: user.totalProblemsSolved,
        acceptanceRate: user.acceptanceRate,
      },
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get user's trophy history
router.get("/trophy-history", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("trophyHistory.problemId", "title difficulty")
      .populate("trophyHistory.matchId", "status")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Sort trophy history by date (newest first)
    const sortedHistory = user.trophyHistory.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Calculate stats
    const stats = {
      currentTrophies: user.trophies,
      totalEarned: user.statistics.totalTrophiesEarned || 0,
      totalLost: user.statistics.totalTrophiesLost || 0,
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

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { username, email, preferences } = req.body
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if username is already taken (if changed)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username })
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" })
      }
      user.username = username
    }

    // Check if email is already taken (if changed)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: "Email already taken" })
      }
      user.email = email
    }

    // Update preferences
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences }
    }

    await user.save()

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        preferences: user.preferences,
        trophies: user.trophies,
      },
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    res.status(500).json({ message: "Server error" })
  }
})


// Get user's recent matches
router.get("/:userId/recent-matches", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { limit = 5 } = req.query

    const matches = await Match.find({
      $or: [{ userA: userId }, { userB: userId }],
      status: "completed",
    })
      .populate("userA", "username trophies")
      .populate("userB", "username trophies")
      .populate("problem", "title difficulty")
      .sort({ endTime: -1 })
      .limit(Number.parseInt(limit))

    const formattedMatches = matches.map((match) => {
      const isUserA = match.userA._id.toString() === userId
      const opponent = isUserA ? match.userB : match.userA
      const result = match.winner ? (match.winner.toString() === userId ? "win" : "loss") : "tie"

      return {
        id: match._id,
        date: match.endTime,
        opponent: {
          username: opponent.username,
          trophies: opponent.trophies,
        },
        problem: {
          title: match.problem.title,
          difficulty: match.problem.difficulty,
        },
        result,
        trophyChange: isUserA ? match.trophyChangeA : match.trophyChangeB,
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
