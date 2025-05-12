const express = require("express")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get global leaderboard
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, timeframe } = req.query

    // Base query
    const query = {}

    // Apply timeframe filter if specified
    // In a real app, you would filter based on matches within the timeframe
    // For demo purposes, we'll just use the current ratings

    // Get users sorted by rating
    const users = await User.find(query)
      .select("username rating totalMatches wins losses")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1 })

    // Get total count
    const count = await User.countDocuments(query)

    // Calculate win rates and format response
    const formattedUsers = users.map((user) => {
      const winRate = user.totalMatches > 0 ? Math.round((user.wins / user.totalMatches) * 100) : 0

      return {
        id: user._id,
        username: user.username,
        rating: user.rating,
        totalMatches: user.totalMatches,
        wins: user.wins,
        losses: user.losses,
        winRate,
      }
    })

    res.status(200).json({
      users: formattedUsers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count,
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    res.status(500).json({
      message: "Server error while fetching leaderboard",
    })
  }
})

// Get user's rank
router.get("/rank", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id

    // Get user's rating
    const user = await User.findById(userId).select("rating")

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    // Count users with higher rating
    const higherRatedUsers = await User.countDocuments({
      rating: { $gt: user.rating },
    })

    // User's rank is the number of higher rated users + 1
    const rank = higherRatedUsers + 1

    res.status(200).json({
      rank,
      rating: user.rating,
    })
  } catch (error) {
    console.error("Error fetching user rank:", error)
    res.status(500).json({
      message: "Server error while fetching user rank",
    })
  }
})

// Get top performers for a specific time period
router.get("/top-performers", async (req, res) => {
  try {
    const { period = "weekly", limit = 5 } = req.query

    // In a real app, you would calculate top performers based on matches within the period
    // For demo purposes, we'll just return the top rated users

    const users = await User.find({ totalMatches: { $gt: 0 } })
      .select("username rating totalMatches wins losses")
      .limit(limit)
      .sort({ rating: -1 })

    // Format response
    const formattedUsers = users.map((user) => {
      const winRate = Math.round((user.wins / user.totalMatches) * 100)

      return {
        id: user._id,
        username: user.username,
        rating: user.rating,
        totalMatches: user.totalMatches,
        winRate,
      }
    })

    res.status(200).json({
      period,
      users: formattedUsers,
    })
  } catch (error) {
    console.error("Error fetching top performers:", error)
    res.status(500).json({
      message: "Server error while fetching top performers",
    })
  }
})

module.exports = router
