const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Match = require("../models/Match")
const { authenticateToken } = require("../middleware/auth")
// Get leaderboard with enhanced statistics
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { limit = 50, search } = req.query

    // Build query
    const query = {}
    if (search) {
      query.username = { $regex: search, $options: "i" }
    }

    // Get users sorted by trophies
    const users = await User.find(query)
      .select("username trophies matchesPlayed matchesWon matchesLost")
      .sort({ trophies: -1 })
      .limit(Number.parseInt(limit))

    // Calculate additional stats for each user
    const leaderboard = users.map((user, index) => ({
      _id: user._id,
      username: user.username,
      trophies: user.trophies || 0,
      matchesPlayed: user.matchesPlayed || 0,
      winRate: user.matchesPlayed > 0 ? Math.round((user.matchesWon / user.matchesPlayed) * 100) : 0,
      rank: index + 1,
    }))

    // Get current user's rank if authenticated
    let userRank = null
    if (req.user) {
      const currentUser = await User.findById(req.user.id)
      if (currentUser) {
        const userPosition = await User.countDocuments({
          trophies: { $gt: currentUser.trophies },
        })

        userRank = {
          rank: userPosition + 1,
          trophies: currentUser.trophies,
          winRate:
            currentUser.matchesPlayed > 0 ? Math.round((currentUser.matchesWon / currentUser.matchesPlayed) * 100) : 0,
        }
      }
    }

    res.json({
      success: true,
      leaderboard,
      userRank,
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching leaderboard",
      error: error.message,
    })
  }
})

// Get top performers for a specific time period
router.get("/top/:period", async (req, res) => {
  try {
    const { period } = req.params // week, month, year
    const { limit = 10 } = req.query

    const timeFilter = {}
    const now = new Date()

    switch (period) {
      case "week":
        timeFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        break
      case "month":
        timeFilter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        break
      case "year":
        timeFilter.createdAt = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
        break
      default:
        // All time - no filter
        break
    }

    // Get matches for the period
    const matches = await Match.find({
      ...timeFilter,
      status: "completed",
    })
      .populate("userA userB winner", "username rating")
      .lean()

    // Calculate performance metrics
    const userStats = {}

    matches.forEach((match) => {
      const userA = match.userA
      const userB = match.userB
      const winner = match.winner

      // Initialize user stats if not exists
      if (!userStats[userA._id]) {
        userStats[userA._id] = {
          user: userA,
          matches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
        }
      }
      if (!userStats[userB._id]) {
        userStats[userB._id] = {
          user: userB,
          matches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
        }
      }

      // Update match counts
      userStats[userA._id].matches++
      userStats[userB._id].matches++

      // Update win/loss counts
      if (winner) {
        if (winner._id.toString() === userA._id.toString()) {
          userStats[userA._id].wins++
          userStats[userB._id].losses++
        } else if (winner._id.toString() === userB._id.toString()) {
          userStats[userB._id].wins++
          userStats[userA._id].losses++
        }
      }
    })

    // Calculate win rates and convert to array
    const topPerformers = Object.values(userStats)
      .map((stats) => ({
        ...stats,
        winRate: stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0,
      }))
      .filter((stats) => stats.matches >= 3) // Minimum 3 matches to be considered
      .sort((a, b) => {
        // Sort by win rate first, then by number of matches
        if (b.winRate === a.winRate) {
          return b.matches - a.matches
        }
        return b.winRate - a.winRate
      })
      .slice(0, Number.parseInt(limit))

    res.json({
      success: true,
      topPerformers,
      period,
      totalMatches: matches.length,
    })
  } catch (error) {
    console.error("Error fetching top performers:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching top performers",
      error: error.message,
    })
  }
})

// Fix the matches route to properly handle concede functionality
router.post("/matches/:matchId/concede", async (req, res) => {
  try {
    const { matchId } = req.params
    const { userId } = req.body

    const match = await Match.findById(matchId).lean()

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      })
    }

    if (match.status !== "inProgress") {
      return res.status(400).json({
        success: false,
        message: "Match is not in progress",
      })
    }

    if (match.userA.toString() === userId || match.userB.toString() === userId) {
      match.status = "completed"
      match.winner = match.userA.toString() === userId ? match.userB : match.userA

      await match.save()

      return res.json({
        success: true,
        message: "Match conceded successfully",
        match,
      })
    }

    return res.status(403).json({
      success: false,
      message: "You are not a participant in this match",
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

module.exports = router
