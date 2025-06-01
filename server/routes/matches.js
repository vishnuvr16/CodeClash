const express = require("express")
const mongoose = require("mongoose")
const Match = require("../models/Match")
const User = require("../models/User")
const Problem = require("../models/Problem")
const { calculateNewRatings } = require("../utils/elo")
const { authenticateToken } = require("../middleware/auth")
const { evaluateCode, runCode } = require("../utils/codeEvaluation")

const router = express.Router()

// Route to create a new match
router.post("/start", authenticateToken, async (req, res) => {
  try {
    const { opponentId, problemId } = req.body
    const userId = req.user._id

    // Validate opponent and problem
    const [opponent, problem] = await Promise.all([
      User.findById(opponentId),
      problemId ? Problem.findById(problemId) : Problem.findOne(),
    ])

    if (!opponent) {
      return res.status(404).json({
        message: "Opponent not found",
      })
    }

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      })
    }

    // Create new match
    const match = new Match({
      userA: userId,
      userB: opponentId,
      problem: problem._id,
      status: "pending",
      startTime: new Date(),
    })

    await match.save()

    // Update user match history
    await Promise.all([
      User.findByIdAndUpdate(userId, { $push: { matchHistory: match._id } }),
      User.findByIdAndUpdate(opponentId, { $push: { matchHistory: match._id } }),
    ])

    res.status(201).json({
      message: "Match created successfully",
      match,
    })
  } catch (error) {
    console.error("Error starting match:", error)
    res.status(500).json({
      message: "Server error while starting match",
      error: error.message,
    })
  }
})

// Route to get a match by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("userA", "username rating")
      .populate("userB", "username rating")
      .populate("problem")
      .populate("winner", "username")

    if (!match) {
      return res.status(404).json({
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    const userId = req.user._id.toString()
    if (match.userA._id.toString() !== userId && match.userB._id.toString() !== userId) {
      return res.status(403).json({
        message: "You are not authorized to view this match",
      })
    }

    res.status(200).json(match)
  } catch (error) {
    console.error("Error fetching match:", error)
    res.status(500).json({
      message: "Server error while fetching match",
      error: error.message,
    })
  }
})

// Route to submit a solution for a match
router.post("/:id/submit", authenticateToken, async (req, res) => {
  try {
    const { code, language } = req.body
    const userId = req.user._id

    // Find match
    const match = await Match.findById(req.params.id).populate("problem")

    if (!match) {
      return res.status(404).json({
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    if (match.userA.toString() !== userId.toString() && match.userB.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to submit to this match",
      })
    }

    // Check if match is active
    if (match.status !== "active" && match.status !== "pending") {
      return res.status(400).json({
        message: "Match is not active",
      })
    }

    // If match is pending, set it to active
    if (match.status === "pending") {
      match.status = "active"
      match.startTime = new Date()
    }

    // Calculate time taken
    const timeTaken = Math.floor((new Date() - match.startTime) / 1000)

    // Evaluate code against test cases
    const evaluation = await evaluateCode(code, language, match.problem.testCases)

    if (!evaluation.success) {
      return res.status(400).json({
        message: "Code evaluation failed",
        error: evaluation.error,
      })
    }

    const isCorrect = evaluation.allPassed

    // Create submission
    const submission = {
      user: userId,
      code,
      language,
      isCorrect,
      timeTaken,
      submittedAt: new Date(),
    }

    // Add submission to match
    match.submissions.push(submission)

    // If submission is correct, check if this is the first correct submission
    if (isCorrect && !match.winner) {
      match.winner = userId
      match.endTime = new Date()
      match.status = "completed"

      // Calculate rating changes
      const [userA, userB] = await Promise.all([User.findById(match.userA), User.findById(match.userB)])

      if (!userA || !userB) {
        return res.status(404).json({
          message: "One or both users not found",
        })
      }

      const { ratingChangeA, ratingChangeB } = calculateRatingChanges(
        userA.rating || 1200,
        userB.rating || 1200,
        match.winner.toString() === match.userA.toString(),
      )

      match.ratingChangeA = ratingChangeA
      match.ratingChangeB = ratingChangeB

      // Update user ratings and stats
      await Promise.all([
        User.findByIdAndUpdate(match.userA, {
          $inc: {
            rating: ratingChangeA,
            matchesPlayed: 1,
            matchesWon: match.winner.toString() === match.userA.toString() ? 1 : 0,
            matchesLost: match.winner.toString() === match.userA.toString() ? 0 : 1,
          },
        }),
        User.findByIdAndUpdate(match.userB, {
          $inc: {
            rating: ratingChangeB,
            matchesPlayed: 1,
            matchesWon: match.winner.toString() === match.userB.toString() ? 1 : 0,
            matchesLost: match.winner.toString() === match.userB.toString() ? 0 : 1,
          },
        }),
      ])

      // Add problem to solved problems for the winner
      await User.findByIdAndUpdate(match.winner, {
        $addToSet: { solvedProblems: { problemId: match.problem._id } },
      })
    }

    await match.save()

    res.status(200).json({
      message: "Code submitted successfully",
      submission: {
        isCorrect,
        timeTaken,
        results: evaluation.results,
      },
      match: {
        status: match.status,
        winner: match.winner,
        ratingChangeA: match.ratingChangeA,
        ratingChangeB: match.ratingChangeB,
      },
    })
  } catch (error) {
    console.error("Error submitting code:", error)
    res.status(500).json({
      message: "Server error while submitting code",
      error: error.message,
    })
  }
})

// Route to concede a match
router.post("/:id/concede", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id

    // Find match
    const match = await Match.findById(req.params.id)

    if (!match) {
      return res.status(404).json({
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    if (match.userA.toString() !== userId.toString() && match.userB.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to concede this match",
      })
    }

    // Check if match is active or pending
    if (match.status !== "active" && match.status !== "pending") {
      return res.status(400).json({
        message: "Match is not active",
      })
    }

    // Set the opponent as the winner
    const isUserA = match.userA.toString() === userId.toString()
    match.winner = isUserA ? match.userB : match.userA
    match.endTime = new Date()
    match.status = "completed"
    match.concedeBy = userId

    // Get user data for rating calculation
    const [userA, userB] = await Promise.all([User.findById(match.userA), User.findById(match.userB)])

    if (!userA || !userB) {
      return res.status(404).json({
        message: "One or both users not found",
      })
    }

    // Calculate rating changes
    const { ratingChangeA, ratingChangeB } = calculateRatingChanges(
      userA.rating || 1200,
      userB.rating || 1200,
      match.winner.toString() === match.userA.toString(),
    )

    match.ratingChangeA = ratingChangeA
    match.ratingChangeB = ratingChangeB

    // Update user ratings and stats
    await Promise.all([
      User.findByIdAndUpdate(match.userA, {
        $inc: {
          rating: ratingChangeA,
          matchesPlayed: 1,
          matchesWon: match.winner.toString() === match.userA.toString() ? 1 : 0,
          matchesLost: match.winner.toString() === match.userA.toString() ? 0 : 1,
        },
      }),
      User.findByIdAndUpdate(match.userB, {
        $inc: {
          rating: ratingChangeB,
          matchesPlayed: 1,
          matchesWon: match.winner.toString() === match.userB.toString() ? 1 : 0,
          matchesLost: match.winner.toString() === match.userB.toString() ? 0 : 1,
        },
      }),
    ])

    await match.save()

    res.status(200).json({
      message: "Match conceded successfully",
      match: {
        status: match.status,
        winner: match.winner,
        concedeBy: match.concedeBy,
        ratingChangeA: match.ratingChangeA,
        ratingChangeB: match.ratingChangeB,
      },
    })
  } catch (error) {
    console.error("Error conceding match:", error)
    res.status(500).json({
      message: "Server error while conceding match",
      error: error.message,
    })
  }
})

// Route to run code (without submitting)
router.post("/:id/run", authenticateToken, async (req, res) => {
  try {
    const { code, language, testCaseIndex } = req.body
    const userId = req.user._id

    // Find match
    const match = await Match.findById(req.params.id).populate("problem")

    if (!match) {
      return res.status(404).json({
        message: "Match not found",
      })
    }

    // Check if user is part of the match
    if (match.userA.toString() !== userId.toString() && match.userB.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to run code for this match",
      })
    }

    // Get the test case
    const testCase = match.problem.testCases[testCaseIndex] || match.problem.testCases[0]

    if (!testCase) {
      return res.status(400).json({
        message: "No test cases available for this problem",
      })
    }

    // Run code using our utility
    const result = await runCode(code, language, testCase)

    if (!result.success) {
      return res.status(400).json({
        message: "Code execution failed",
        error: result.error,
      })
    }

    // Save the code as a draft submission
    const existingSubmissionIndex = match.submissions.findIndex(
      (sub) => sub.user.toString() === userId.toString() && sub.language === language && !sub.isSubmitted,
    )

    if (existingSubmissionIndex >= 0) {
      // Update existing draft submission
      match.submissions[existingSubmissionIndex].code = code
      match.submissions[existingSubmissionIndex].updatedAt = new Date()
    } else {
      // Create new draft submission
      match.submissions.push({
        user: userId,
        code,
        language,
        isCorrect: false,
        isSubmitted: false,
        timeTaken: 0,
        submittedAt: new Date(),
      })
    }

    await match.save()

    res.status(200).json({
      result: result.result,
    })
  } catch (error) {
    console.error("Error running code:", error)
    res.status(500).json({
      message: "Server error while running code",
      error: error.message,
    })
  }
})

// Route to get user's match history
router.get("/user/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id
    const { page = 1, limit = 10, result } = req.query

    // Build query
    const query = {
      $or: [{ userA: userId }, { userB: userId }],
      status: "completed",
    }

    // Filter by result if specified
    if (result === "wins") {
      query.winner = userId
    } else if (result === "losses") {
      query.$and = [{ winner: { $ne: null } }, { winner: { $ne: userId } }]
    }

    // Find matches
    const matches = await Match.find(query)
      .populate("userA", "username rating")
      .populate("userB", "username rating")
      .populate("problem", "title difficulty")
      .populate("winner", "username")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    // Get total count
    const count = await Match.countDocuments(query)

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
        concedeBy: match.concedeBy ? (match.concedeBy.toString() === userId.toString() ? "you" : "opponent") : null,
      }
    })

    res.status(200).json({
      matches: formattedMatches,
      totalPages: Math.ceil(count / limit),
      currentPage: Number.parseInt(page),
      totalMatches: count,
    })
  } catch (error) {
    console.error("Error fetching match history:", error)
    res.status(500).json({
      message: "Server error while fetching match history",
      error: error.message,
    })
  }
})

// Helper function to calculate rating changes
function calculateRatingChanges(ratingA, ratingB, isAWinner) {
  const K = 32 // K-factor for ELO rating system

  // Calculate expected scores
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400))

  // Calculate actual scores
  const actualA = isAWinner ? 1 : 0
  const actualB = isAWinner ? 0 : 1

  // Calculate rating changes
  const ratingChangeA = Math.round(K * (actualA - expectedA))
  const ratingChangeB = Math.round(K * (actualB - expectedB))

  return { ratingChangeA, ratingChangeB }
}

module.exports = router
