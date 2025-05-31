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

    // Get users sorted by rating with proper win rate calculation
    const users = await User.aggregate([
      { $match: query },
      {
        $addFields: {
          winRate: {
            $cond: {
              if: { $eq: ["$totalMatches", 0] },
              then: 0,
              else: {
                $round: [{ $multiply: [{ $divide: ["$wins", "$totalMatches"] }, 100] }, 1],
              },
            },
          },
        },
      },
      { $sort: { rating: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: Number.parseInt(limit) },
      {
        $project: {
          username: 1,
          rating: 1,
          totalMatches: 1,
          wins: 1,
          losses: 1,
          winRate: 1,
        },
      },
    ])

    // Get total count
    const count = await User.countDocuments(query)

    res.status(200).json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: Number.parseInt(page),
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
