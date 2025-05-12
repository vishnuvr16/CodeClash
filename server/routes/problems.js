const express = require("express")
const Problem = require("../models/Problem")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get random problem
router.get("/random", authenticateToken, async (req, res) => {
  try {
    const { difficulty } = req.query

    // Build query based on difficulty if provided
    const query = difficulty ? { difficulty } : {}

    // Count total problems matching the query
    const count = await Problem.countDocuments(query)

    if (count === 0) {
      return res.status(404).json({
        message: "No problems found",
      })
    }

    // Get a random problem
    const random = Math.floor(Math.random() * count)
    const problem = await Problem.findOne(query).skip(random)

    res.status(200).json(problem)
  } catch (error) {
    console.error("Error fetching random problem:", error)
    res.status(500).json({
      message: "Server error while fetching random problem",
    })
  }
})

// Get problem by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      })
    }

    res.status(200).json(problem)
  } catch (error) {
    console.error("Error fetching problem:", error)
    res.status(500).json({
      message: "Server error while fetching problem",
    })
  }
})

// Get all problems (with pagination and filtering)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, difficulty, search } = req.query

    // Build query
    const query = {}

    if (difficulty) {
      query.difficulty = difficulty
    }

    if (search) {
      query.title = { $regex: search, $options: "i" }
    }

    // Execute query with pagination
    const problems = await Problem.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    // Get total count
    const count = await Problem.countDocuments(query)

    res.status(200).json({
      problems,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalProblems: count,
    })
  } catch (error) {
    console.error("Error fetching problems:", error)
    res.status(500).json({
      message: "Server error while fetching problems",
    })
  }
})

// Create a new problem (admin only - in a real app, add admin middleware)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, difficulty, testCases, starterCode } = req.body

    // Check if problem with same title already exists
    const existingProblem = await Problem.findOne({ title })

    if (existingProblem) {
      return res.status(400).json({
        message: "Problem with this title already exists",
      })
    }

    // Create new problem
    const problem = new Problem({
      title,
      description,
      difficulty,
      testCases,
      starterCode,
    })

    await problem.save()

    res.status(201).json({
      message: "Problem created successfully",
      problem,
    })
  } catch (error) {
    console.error("Error creating problem:", error)
    res.status(500).json({
      message: "Server error while creating problem",
    })
  }
})

// Update a problem (admin only)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { title, description, difficulty, testCases, starterCode } = req.body

    // Check if problem exists
    const problem = await Problem.findById(req.params.id)

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      })
    }

    // Update problem
    const updatedProblem = await Problem.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, difficulty, testCases, starterCode } },
      { new: true },
    )

    res.status(200).json({
      message: "Problem updated successfully",
      problem: updatedProblem,
    })
  } catch (error) {
    console.error("Error updating problem:", error)
    res.status(500).json({
      message: "Server error while updating problem",
    })
  }
})

// Delete a problem (admin only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    // Check if problem exists
    const problem = await Problem.findById(req.params.id)

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      })
    }

    // Delete problem
    await Problem.findByIdAndDelete(req.params.id)

    res.status(200).json({
      message: "Problem deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting problem:", error)
    res.status(500).json({
      message: "Server error while deleting problem",
    })
  }
})

module.exports = router
