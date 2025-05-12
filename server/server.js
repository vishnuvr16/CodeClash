const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const http = require("http")
const socketIo = require("socket.io")
const path = require("path")
require("dotenv").config()

// Import routes
const authRoutes = require("./routes/auth")
const problemRoutes = require("./routes/problems")
const userRoutes = require("./routes/users")
const leaderboardRoutes = require("./routes/leaderboard")
const matchRoutes = require("./routes/matches")
const practiceRoutes = require("./routes/practice")

// Import socket handlers
const { setupSocketHandlers } = require("./socket/socketHandlers")

// Create Express app
const app = express()
const server = http.createServer(app)

// Configure CORS with specific options
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
}

// Apply CORS middleware
app.use(cors(corsOptions))

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/problems", problemRoutes)
app.use("/api/user", userRoutes)
app.use("/api/leaderboard", leaderboardRoutes)
app.use("/api/matches", matchRoutes)
app.use("/api/practice", practiceRoutes)

// Set up Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Set up socket handlers
setupSocketHandlers(io)

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")))

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"))
  })
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/peerprep_duel")
  .then(() => {
    console.log("Connected to MongoDB")

    // Start server
    const PORT = process.env.PORT || 5000
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
  })

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something went wrong!" })
})
