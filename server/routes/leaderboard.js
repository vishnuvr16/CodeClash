const express = require("express")
const router = express.Router()
const User = require("../models/User")

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, timeframe = "all-time" } = req.query

    // Build match condition based on timeframe
    const matchCondition = {}
    if (timeframe !== "all-time") {
      const date = new Date()
      switch (timeframe) {
        case "weekly":
          date.setDate(date.getDate() - 7)
          break
        case "monthly":
          date.setMonth(date.getMonth() - 1)
          break
        case "yearly":
          date.setFullYear(date.getFullYear() - 1)
          break
      }
      matchCondition.updatedAt = { $gte: date }
    }

    const pipeline = [
      { $match: matchCondition },
      {
        $addFields: {
          winRate: {
            $cond: {
              if: { $eq: ["$matchesPlayed", 0] },
              then: 0,
              else: {
                $round: [{ $multiply: [{ $divide: ["$matchesWon", "$matchesPlayed"] }, 100] }, 1],
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
          matchesPlayed: 1,
          matchesWon: 1,
          matchesLost: 1,
          winRate: 1,
          profilePicture: 1,
          createdAt: 1,
        },
      },
    ]

    const users = await User.aggregate(pipeline)

    // Add rank to each user
    const usersWithRank = users.map((user, index) => ({
      ...user,
      rank: (page - 1) * limit + index + 1,
    }))

    // Get total count for pagination
    const totalUsers = await User.countDocuments(matchCondition)
    const totalPages = Math.ceil(totalUsers / limit)

    res.json({
      users: usersWithRank,
      currentPage: Number.parseInt(page),
      totalPages,
      totalUsers,
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
