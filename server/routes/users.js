const express = require("express")
const User = require("../models/User")
const Match = require("../models/Match")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id

    // Get user with stats
    const user = await User.findById(userId).select("-password")

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    // Get rating history
    const matches = await Match.find({
      $or: [{ userA: userId }, { userB: userId }],
      status: "completed",
    })
      .sort({ createdAt: 1 })
      .select("createdAt ratingChangeA ratingChangeB userA userB")

    // Calculate rating history
    let currentRating = 1200 // Starting rating
    const ratingHistory = matches.map((match) => {
      const isUserA = match.userA.toString() === userId.toString()
      const ratingChange = isUserA ? match.ratingChangeA : match.ratingChangeB
      currentRating += ratingChange

      return {
        date: match.createdAt,
        rating: currentRating,
      }
    })

    // Add initial rating
    ratingHistory.unshift({
      date: user.createdAt,
      rating: 1200,
    })

    res.status(200).json({
      user,
      stats: {
        totalMatches: user.totalMatches,
        wins: user.wins,
        losses: user.losses,
        winRate: user.totalMatches > 0 ? Math.round((user.wins / user.totalMatches) * 100) : 0,
        ratingHistory,
      },
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({
      message: "Server error while fetching user profile",
    })
  }
})

// Get user by ID (public profile)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username rating totalMatches wins losses createdAt")

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    // Calculate win rate
    const winRate = user.totalMatches > 0 ? Math.round((user.wins / user.totalMatches) * 100) : 0

    res.status(200).json({
      user: {
        ...user.toObject(),
        winRate,
      },
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    res.status(500).json({
      message: "Server error while fetching user",
    })
  }
})

// Get user's recent matches
router.get("/:id/recent-matches", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id
    const limit = req.query.limit || 5

    // Find recent completed matches
    const matches = await Match.find({
      $or: [{ userA: userId }, { userB: userId }],
      status: "completed",
    })
      .populate("userA", "username rating")
      .populate("userB", "username rating")
      .populate("problem", "title difficulty")
      .populate("winner", "username")
      .limit(limit)
      .sort({ createdAt: -1 })

    // Format matches for response
    const formattedMatches = matches.map((match) => {
      const isUserA = match.userA._id.toString() === userId.toString()
      const opponent = isUserA ? match.userB : match.userA
      const ratingChange = isUserA ? match.ratingChangeA : match.ratingChangeB
      const result = match.winner && match.winner._id.toString() === userId.toString() ? "win" : "loss"

      return {
        id: match._id,
        opponent: {
          id: opponent._id,
          username: opponent.username,
          rating: opponent.rating,
        },
        problem: {
          id: match.problem._id,
          title: match.problem.title,
          difficulty: match.problem.difficulty,
        },
        result,
        ratingChange,
        date: match.createdAt,
      }
    })

    res.status(200).json({
      matches: formattedMatches,
    })
  } catch (error) {
    console.error("Error fetching recent matches:", error)
    res.status(500).json({
      message: "Server error while fetching recent matches",
    })
  }
})

// Search users
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const { query, limit = 10 } = req.query

    if (!query) {
      return res.status(400).json({
        message: "Search query is required",
      })
    }

    // Search users by username
    const users = await User.find({
      username: { $regex: query, $options: "i" },
    })
      .select("username rating")
      .limit(limit)

    res.status(200).json({
      users,
    })
  } catch (error) {
    console.error("Error searching users:", error)
    res.status(500).json({
      message: "Server error while searching users",
    })
  }
})

module.exports = router
