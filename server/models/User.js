const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId
      },
    },
    googleId: {
      type: String,
      sparse: true,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 1200,
    },
    matchesPlayed: {
      type: Number,
      default: 0,
    },
    matchesWon: {
      type: Number,
      default: 0,
    },
    matchesLost: {
      type: Number,
      default: 0,
    },
    matchesTied: {
      type: Number,
      default: 0,
    },
    solvedProblems: [
      {
        problemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Problem",
        },
        solvedAt: {
          type: Date,
          default: Date.now,
        },
        language: String,
        code: String,
        executionTime: Number,
        memoryUsed: Number,
      },
    ],
    submissions: [
      {
        problemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Problem",
        },
        code: String,
        language: String,
        status: String,
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        executionTime: Number,
        memoryUsed: Number,
        testResults: [
          {
            input: String,
            expectedOutput: String,
            actualOutput: String,
            passed: Boolean,
            executionTime: Number,
          },
        ],
      },
    ],
    preferences: {
      theme: {
        type: String,
        default: "dark",
        enum: ["light", "dark"],
      },
      language: {
        type: String,
        default: "javascript",
      },
      fontSize: {
        type: Number,
        default: 14,
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },
    statistics: {
      totalSubmissions: { type: Number, default: 0 },
      acceptedSubmissions: { type: Number, default: 0 },
      easyProblemsSolved: { type: Number, default: 0 },
      mediumProblemsSolved: { type: Number, default: 0 },
      hardProblemsSolved: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastSolvedDate: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Virtual field for total problems solved
userSchema.virtual("totalProblemsSolved").get(function () {
  return this.solvedProblems.length
})

// Virtual field for acceptance rate
userSchema.virtual("acceptanceRate").get(function () {
  if (this.statistics.totalSubmissions === 0) return 0
  return Math.round((this.statistics.acceptedSubmissions / this.statistics.totalSubmissions) * 100)
})

// Virtual field for win rate
userSchema.virtual("winRate").get(function () {
  if (this.matchesPlayed === 0) return 0
  return Math.round((this.matchesWon / this.matchesPlayed) * 100)
})

// Ensure virtual fields are serialized
userSchema.set("toJSON", { virtuals: true })
userSchema.set("toObject", { virtuals: true })


// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new) and exists
  if (!this.isModified("password") || !this.password) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // If user has no password (Google Sign-In), return false
  if (!this.password) {
    return false
  }

  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw error
  }
}

const User = mongoose.model("User", userSchema)

module.exports = User
