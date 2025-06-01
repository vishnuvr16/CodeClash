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
    if (timeframe && timeframe !== "all-time") {
      const date = new Date()
      if (timeframe === "weekly") {
        date.setDate(date.getDate() - 7)
      } else if (timeframe === "monthly") {
        date.setMonth(date.getMonth() - 1)
      }
      query.updatedAt = { $gte: date }
    }

    // Get users sorted by rating with proper win rate calculation
    const users = await User.aggregate([
      { $match: query },
      {
        $addFields: {
          // Calculate win rate safely
          winRate: {
            $cond: {
              if: { $gt: [{ $ifNull: ["$matchesPlayed", 0] }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [{ $ifNull: ["$matchesWon", 0] }, { $ifNull: ["$matchesPlayed", 0] }],
                  },
                  100,
                ],
              },
              else: 0,
            },
          },
          // Ensure these fields exist
          matchesPlayed: { $ifNull: ["$matchesPlayed", 0] },
          matchesWon: { $ifNull: ["$matchesWon", 0] },
          matchesLost: { $ifNull: ["$matchesLost", 0] },
        },
      },
      { $sort: { rating: -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 1,
          username: 1,
          rating: 1,
          matchesPlayed: 1,
          matchesWon: 1,
          matchesLost: 1,
          winRate: { $round: ["$winRate", 1] },
          profilePicture: 1,
        },
      },
    ])

    // Get total count
    const count = await User.countDocuments(query)

    res.status(200).json({
      users,
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
      totalUsers: count,
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    res.status(500).json({
      message: "Server error while fetching leaderboard",
      error: error.message,
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
      error: error.message,
    })
  }
})

// Get top performers for a specific time period
router.get("/top-performers", async (req, res) => {
  try {
    const { period = "weekly", limit = 5 } = req.query

    // Set date filter based on period
    const dateFilter = {}
    const now = new Date()

    if (period === "weekly") {
      const weekAgo = new Date(now)
      weekAgo.setDate(now.getDate() - 7)
      dateFilter.updatedAt = { $gte: weekAgo }
    } else if (period === "monthly") {
      const monthAgo = new Date(now)
      monthAgo.setMonth(now.getMonth() - 1)
      dateFilter.updatedAt = { $gte: monthAgo }
    }

    // Find users with matches played
    const users = await User.find({
      matchesPlayed: { $gt: 0 },
      ...dateFilter,
    })
      .select("username rating matchesPlayed matchesWon matchesLost")
      .limit(Number(limit))
      .sort({ rating: -1 })

    // Format response with calculated win rate
    const formattedUsers = users.map((user) => {
      const winRate = user.matchesPlayed > 0 ? Math.round((user.matchesWon / user.matchesPlayed) * 100) : 0

      return {
        id: user._id,
        username: user.username,
        rating: user.rating,
        matchesPlayed: user.matchesPlayed,
        matchesWon: user.matchesWon,
        matchesLost: user.matchesLost,
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
      error: error.message,
    })
  }
})

module.exports = router
