const mongoose = require("mongoose")

const functionSignatureSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true,
    enum: ["javascript", "python", "java", "cpp"],
  },
  functionName: {
    type: String,
    required: true,
  },
  parameters: [
    {
      name: String,
      type: String,
      description: String,
    },
  ],
  returnType: {
    type: String,
    required: true,
  },
  template: {
    type: String,
    required: true,
  },
})

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard"],
    },
    tags: [String],
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    constraints: String,
    hints: [String],
    functionSignatures: [functionSignatureSchema],
    testCases: [
      {
        input: mongoose.Schema.Types.Mixed,
        output: mongoose.Schema.Types.Mixed,
        isHidden: {
          type: Boolean,
          default: false,
        },
      },
    ],
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Virtual field for trophy reward
problemSchema.virtual("trophyReward").get(function () {
  const rewards = { Easy: 5, Medium: 10, Hard: 15 }
  return rewards[this.difficulty] || 0
})

// Ensure virtual fields are serialized
problemSchema.set("toJSON", { virtuals: true })
problemSchema.set("toObject", { virtuals: true })

const Problem = mongoose.model("Problem", problemSchema)

module.exports = Problem
