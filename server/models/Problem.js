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
  testCases: [TestCaseSchema],
  starterCode: {
    javascript: {
      type: String,
      default: "",
    },
    python: {
      type: String,
      default: "",
    },
    java: {
      type: String,
      default: "",
    },
  },
  timeLimit: {
    type: Number,
    default: 1800, // 30 minutes in seconds
  },
  solvedCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Problem", ProblemSchema)
