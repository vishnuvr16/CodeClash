const mongoose = require("mongoose")

const SubmissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    enum: ["javascript", "python", "java"],
    required: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  isSubmitted: {
    type: Boolean,
    default: true,
  },
  timeTaken: {
    type: Number, // in seconds
    default: 0,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
})

const MatchSchema = new mongoose.Schema({
  userA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
  },
  submissions: [SubmissionSchema],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  concedeBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  ratingChangeA: {
    type: Number,
    default: 0,
  },
  ratingChangeB: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["pending", "active", "completed", "cancelled"],
    default: "pending",
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Match", MatchSchema)
