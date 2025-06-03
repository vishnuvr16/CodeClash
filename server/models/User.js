const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const trophyHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ["earned", "lost"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Match",
  },
  date: {
    type: Date,
    default: Date.now,
  },
})

const submissionSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Accepted", "Wrong Answer", "Time Limit Exceeded", "Runtime Error", "Compilation Error"],
    required: true,
  },
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
      memoryUsed: Number,
      error: String,
    },
  ],
  performance: {
    timeComplexity: String,
    spaceComplexity: String,
    efficiency: Number,
    runtime: String,
    memory: String,
    percentile: Number,
  },
})

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
    // Trophy system instead of rating
    trophies: {
      type: Number,
      default: 100, // Starting trophies
    },
    trophyHistory: [trophyHistorySchema],
    // Match statistics
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
    // Practice statistics
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
        trophiesEarned: Number,
      },
    ],
    submissions: [submissionSchema],
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
      totalTrophiesEarned: { type: Number, default: 0 },
      totalTrophiesLost: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
)

// Virtual field for total problems solved
userSchema.virtual("totalProblemsSolved").get(function () {
  return this.solvedProblems?.length
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

// Method to add trophy history
userSchema.methods.addTrophyHistory = function (action, amount, reason, problemId = null, matchId = null) {
  this.trophyHistory.push({
    action,
    amount,
    reason,
    problemId,
    matchId,
    date: new Date(),
  })

  if (action === "earned") {
    this.trophies += amount
    this.statistics.totalTrophiesEarned += amount
  } else if (action === "lost") {
    this.trophies = Math.max(0, this.trophies - amount)
    this.statistics.totalTrophiesLost += amount
  }
}

// Method to get trophy tier
userSchema.virtual("trophyTier").get(function () {
  const trophies = this.trophies
  if (trophies >= 5000) return { name: "Legend", color: "#FF6B6B", icon: "👑" }
  if (trophies >= 3000) return { name: "Champion", color: "#4ECDC4", icon: "🏆" }
  if (trophies >= 2000) return { name: "Master", color: "#45B7D1", icon: "🥇" }
  if (trophies >= 1000) return { name: "Expert", color: "#96CEB4", icon: "🥈" }
  if (trophies >= 500) return { name: "Advanced", color: "#FFEAA7", icon: "🥉" }
  if (trophies >= 200) return { name: "Intermediate", color: "#DDA0DD", icon: "🏅" }
  return { name: "Beginner", color: "#A0A0A0", icon: "🔰" }
})

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}


// Ensure virtual fields are serialized
userSchema.set("toJSON", { virtuals: true })
userSchema.set("toObject", { virtuals: true })

const User = mongoose.model("User", userSchema)

module.exports = User
