const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const http = require("http")
const socketIo = require("socket.io")
const path = require("path")
const helmet = require("helmet")
const mongoSanitize = require("express-mongo-sanitize")
const xss = require("xss-clean")
const rateLimit = require("express-rate-limit")

require("dotenv").config()

// Import routes
const authRoutes = require("./routes/auth")
const problemRoutes = require("./routes/problems")
const userRoutes = require("./routes/users")
const leaderboardRoutes = require("./routes/leaderboard")
const matchRoutes = require("./routes/matches")
const practiceRoutes = require("./routes/practice")

// Import socket handlers
const { setupSocketHandlers } = require("./Socket/SocketHandlers")
const { sanitizeInputs } = require("./middleware/auth")

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

// Apply security middleware
app.use(helmet()) // Set security headers
app.use(cors(corsOptions))
app.use(express.json({ limit: "10kb" })) // Limit JSON body size
app.use(sanitizeInputs) // Sanitize inputs to prevent XSS attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }))
app.use(mongoSanitize()) // Prevent MongoDB operator injection
app.use(xss()) // Sanitize user input

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})
app.use("/api/", limiter)

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/problems", problemRoutes)
app.use("/api/user", userRoutes)
app.use("/api/leaderboard", leaderboardRoutes)
app.use("/api/matches", matchRoutes)
app.use("/api/practice", practiceRoutes)

// Set up Socket.IO with CORS and security
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Add security settings
  pingTimeout: 60000,
  pingInterval: 25000,
  cookie: {
    name: "io",
    path: "/",
    httpOnly: true,
    sameSite: "strict",
  },
})

// Set up socket handlers
setupSocketHandlers(io)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" })
})

// Connect to MongoDB with enhanced options
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/peerprep_duel", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
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
    process.exit(1)
  })

