const mongoose = require("mongoose")

const TestCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
})

const ProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  examples: [
    {
      input: String,
      output: String,
      explanation: String,
    },
  ],
  constraints: String,
  hints: [String],
  testCases: [TestCaseSchema],
  timeLimit: {
    type: Number,
    default: 1800, // 30 minutes in seconds
  },
  memoryLimit: {
    type: Number,
    default: 256, // MB
  },
  solvedCount: {
    type: Number,
    default: 0,
  },
  submissionCount: {
    type: Number,
    default: 0,
  },
  acceptanceRate: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Virtual field for trophy reward
ProblemSchema.virtual("trophyReward").get(function () {
  const rewards = { Easy: 5, Medium: 10, Hard: 15 }
  return rewards[this.difficulty] || 0
})

// Ensure virtual fields are serialized
ProblemSchema.set("toJSON", { virtuals: true })
ProblemSchema.set("toObject", { virtuals: true })

module.exports = mongoose.model("Problem", ProblemSchema)
