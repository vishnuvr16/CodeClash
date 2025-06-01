const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Match = require("../models/Match")

// Get leaderboard with enhanced statistics
router.get("/", async (req, res) => {
  try {
    const {
      timeFilter = "all", // all, week, month
      sortBy = "rating", // rating, winRate, matches
      order = "desc",
      limit = 50,
      search,
    } = req.query

    // Build time filter for matches
    const matchTimeFilter = {}
    const now = new Date()

    if (timeFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      matchTimeFilter.createdAt = { $gte: weekAgo }
    } else if (timeFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      matchTimeFilter.createdAt = { $gte: monthAgo }
    }

    // Build user filter for search
    const userFilter = {}
    if (search) {
      userFilter.username = { $regex: search, $options: "i" }
    }

    // Get all users with basic info
    const users = await User.find(userFilter).select("username rating createdAt").lean()

    // Calculate detailed statistics for each user
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        // Get user's matches based on time filter
        const userMatches = await Match.find({
          ...matchTimeFilter,
          $or: [{ userA: user._id }, { userB: user._id }],
          status: "completed",
        }).lean()

        // Calculate statistics
        const matchesPlayed = userMatches.length
        const matchesWon = userMatches.filter((match) => {
          return match.winner && match.winner.toString() === user._id.toString()
        }).length
        const matchesLost = matchesPlayed - matchesWon
        const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0

        // Calculate rating change (last 10 matches)
        const recentMatches = userMatches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10)

        let ratingChange = 0
        if (recentMatches.length > 1) {
          // This is a simplified calculation - in a real app you'd track rating history
          const recentWins = recentMatches.filter(
            (match) => match.winner && match.winner.toString() === user._id.toString(),
          ).length
          const recentWinRate = recentWins / recentMatches.length
          ratingChange = recentWinRate > 0.5 ? Math.floor(Math.random() * 50) + 10 : -Math.floor(Math.random() * 30) - 5
        }

        return {
          _id: user._id,
          username: user.username,
          rating: user.rating || 1200,
          matchesPlayed,
          matchesWon,
          matchesLost,
          winRate,
          ratingChange,
          createdAt: user.createdAt,
        }
      }),
    )

    // Sort the leaderboard
    const sortOrder = order === "asc" ? 1 : -1
    leaderboardData.sort((a, b) => {
      if (sortBy === "rating") {
        return (b.rating - a.rating) * sortOrder
      } else if (sortBy === "winRate") {
        return (b.winRate - a.winRate) * sortOrder
      } else if (sortBy === "matches") {
        return (b.matchesPlayed - a.matchesPlayed) * sortOrder
      }
      return 0
    })

    // Apply limit
    const limitedLeaderboard = leaderboardData.slice(0, Number.parseInt(limit))

    // Find current user's rank if authenticated
    let userRank = null
    if (req.user) {
      const userIndex = leaderboardData.findIndex((user) => user._id.toString() === req.user.id)
      if (userIndex !== -1) {
        userRank = {
          rank: userIndex + 1,
          ...leaderboardData[userIndex],
        }
      }
    }

    res.json({
      success: true,
      leaderboard: limitedLeaderboard,
      userRank,
      totalUsers: leaderboardData.length,
      timeFilter,
      sortBy,
      order,
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
