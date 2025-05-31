const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const Match = require("../models/Match")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")
const { calculateNewRatings } = require("../utils/elo")

// Route to create a new match
router.post("/",authenticateToken, async (req, res) => {
  try {
    const { userAId, userBId, problemId } = req.body

    // Validate input
    if (!userAId || !userBId || !problemId) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Create a new match
    const match = new Match({
      userA: userAId,
      userB: userBId,
      problem: problemId,
      status: "ongoing",
    })

    await match.save()

    res.status(201).json({ message: "Match created successfully", match })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to create match", error: error.message })
  }
})

// Route to get a match by ID
router.get("/:matchId", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.matchId

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: "Invalid match ID" })
    }

    const match = await Match.findById(matchId).populate("userA").populate("userB").populate("problem")

    if (!match) {
      return res.status(404).json({ message: "Match not found" })
    }

    res.status(200).json(match)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to get match", error: error.message })
  }
})

// Route to concede a match
router.put("/:matchId/concede", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.matchId
    const { winnerId } = req.body

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: "Invalid match ID" })
    }

    if (!mongoose.Types.ObjectId.isValid(winnerId)) {
      return res.status(400).json({ message: "Invalid winner ID" })
    }

    const match = await Match.findById(matchId).populate("userA").populate("userB")

    if (!match) {
      return res.status(404).json({ message: "Match not found" })
    }

    if (match.status !== "ongoing") {
      return res.status(400).json({ message: "Match is not ongoing" })
    }

    match.status = "completed"
    match.winner = winnerId
    match.conceded = true

    await match.save()

    // Update user stats
    await Promise.all([
      User.findByIdAndUpdate(match.userA._id, {
        $inc: {
          matchesPlayed: 1,
          [match.userA._id.toString() === winnerId ? "matchesWon" : "matchesLost"]: 1,
        },
      }),
      User.findByIdAndUpdate(match.userB._id, {
        $inc: {
          matchesPlayed: 1,
          [match.userB._id.toString() === winnerId ? "matchesWon" : "matchesLost"]: 1,
        },
      }),
    ])

    res.status(200).json({ message: "Match conceded successfully", match })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to concede match", error: error.message })
  }
})

// Route to submit a solution for a match
router.put("/:matchId/submit", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.matchId
    const { userAId, userBId, solutionA, solutionB } = req.body

    if (!mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: "Invalid match ID" })
    }

    if (!solutionA && !solutionB) {
      return res.status(400).json({ message: "Must submit at least one solution" })
    }

    const match = await Match.findById(matchId).populate("userA").populate("userB")

    if (!match) {
      return res.status(404).json({ message: "Match not found" })
    }

    if (match.status !== "ongoing") {
      return res.status(400).json({ message: "Match is not ongoing" })
    }

    match.solutionA = solutionA || null
    match.solutionB = solutionB || null
    match.status = "completed"

    const ratingA = match.userA.rating
    const ratingB = match.userB.rating

    const { newRatingA, newRatingB } = calculateNewRatings(ratingA, ratingB, solutionA, solutionB)

    const isUserAWinner = newRatingA > ratingA // Determine winner based on rating change

    match.winner = isUserAWinner ? match.userA._id : match.userB._id

    await match.save()

    // Update user ratings and stats
    await Promise.all([
      User.findByIdAndUpdate(match.userA._id, {
        rating: newRatingA,
        $inc: {
          matchesPlayed: 1,
          [isUserAWinner ? "matchesWon" : "matchesLost"]: 1,
        },
      }),
      User.findByIdAndUpdate(match.userB._id, {
        rating: newRatingB,
        $inc: {
          matchesPlayed: 1,
          [isUserAWinner ? "matchesLost" : "matchesWon"]: 1,
        },
      }),
    ])

    res.status(200).json({ message: "Solution submitted successfully", match })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to submit solution", error: error.message })
  }
})

module.exports = router
