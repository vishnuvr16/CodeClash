const User = require("../models/User")
const Match = require("../models/Match")
const Problem = require("../models/Problem")
const jwt = require("jsonwebtoken")

// Queue for matchmaking
let matchmakingQueue = []

// Active matches
const activeMatches = new Map()

// Setup socket handlers
const setupSocketHandlers = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        // Allow connection without token, but user will be limited
        return next()
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret")

      // Find user
      const user = await User.findById(decoded.id).select("-password")

      if (!user) {
        return next(new Error("User not found"))
      }

      // Attach user to socket
      socket.user = user
      next()
    } catch (error) {
      console.error("Socket authentication error:", error)
      next(new Error("Authentication error"))
    }
  })

  io.on("connection", (socket) => {
    // console.log("User connected:", socket.id)

    // Join user's room for private messages
    if (socket.user) {
      socket.join(socket.user._id.toString())
      // console.log(`User ${socket.user.username} joined their room`)
    }

    // Handle matchmaking
    socket.on("join_matchmaking", async () => {
      if (!socket.user) {
        socket.emit("error", { message: "Authentication required" })
        return
      }

      const userId = socket.user._id.toString()

      // Check if user is already in queue
      if (matchmakingQueue.some((user) => user.id === userId)) {
        socket.emit("error", { message: "Already in matchmaking queue" })
        return
      }

      // Add user to queue
      matchmakingQueue.push({
        id: userId,
        socketId: socket.id,
        rating: socket.user.rating,
        joinedAt: new Date(),
      })

      // console.log(`User ${socket.user.username} joined matchmaking queue`)
      socket.emit("matchmaking_joined")

      // Try to find a match
      findMatch(socket)
    })

    // Handle cancel matchmaking
    socket.on("cancel_matchmaking", () => {
      if (!socket.user) {
        socket.emit("error", { message: "Authentication required" })
        return
      }

      const userId = socket.user._id.toString()

      // Remove user from queue
      matchmakingQueue = matchmakingQueue.filter((user) => user.id !== userId)

      // console.log(`User ${socket.user.username} left matchmaking queue`)
      socket.emit("matchmaking_cancelled")
    })

    // Handle joining a match
    socket.on("join_match", async (data) => {
      if (!socket.user) {
        socket.emit("error", { message: "Authentication required" })
        return
      }

      const { matchId } = data
      const userId = socket.user._id.toString()

      try {
        // Find match
        const match = await Match.findById(matchId)
          .populate("userA", "username rating")
          .populate("userB", "username rating")
          .populate("problem")

        if (!match) {
          socket.emit("error", { message: "Match not found" })
          return
        }

        // Check if user is part of the match
        if (match.userA._id.toString() !== userId && match.userB._id.toString() !== userId) {
          socket.emit("error", { message: "Not authorized to join this match" })
          return
        }

        // Join match room
        socket.join(matchId)
        // console.log(`User ${socket.user.username} joined match room ${matchId}`)

        // Store socket in active matches
        if (!activeMatches.has(matchId)) {
          activeMatches.set(matchId, new Map())
        }

        const matchSockets = activeMatches.get(matchId)
        matchSockets.set(userId, socket.id)

        // If both users have joined, start the match
        if (matchSockets.size === 2) {
          // Update match status
          match.status = "active"
          match.startTime = new Date()
          await match.save()

          // Notify both users
          io.to(matchId).emit("match_started", {
            matchId,
            problem: match.problem,
            opponents: {
              userA: {
                id: match.userA._id,
                username: match.userA.username,
                rating: match.userA.rating,
              },
              userB: {
                id: match.userB._id,
                username: match.userB.username,
                rating: match.userB.rating,
              },
            },
            startTime: match.startTime,
          })
        }
      } catch (error) {
        console.error("Error joining match:", error)
        socket.emit("error", { message: "Error joining match" })
      }
    })

    // Handle code updates
    socket.on("code_update", (data) => {
      if (!socket.user) {
        socket.emit("error", { message: "Authentication required" })
        return
      }

      const { matchId, code, language } = data
      const userId = socket.user._id.toString()

      // Check if match exists
      if (!activeMatches.has(matchId)) {
        socket.emit("error", { message: "Match not found" })
        return
      }

      // Get opponent's socket ID
      const matchSockets = activeMatches.get(matchId)
      let opponentId = null

      for (const [id, _] of matchSockets) {
        if (id !== userId) {
          opponentId = id
          break
        }
      }

      if (!opponentId) {
        return // Opponent not connected
      }

      // Send code update to opponent
      io.to(opponentId).emit("opponent_code_update", {
        code,
        language,
      })
    })

    // Handle progress updates
    socket.on("progress_update", (data) => {
      if (!socket.user) {
        socket.emit("error", { message: "Authentication required" })
        return
      }

      const { matchId, progress } = data
      const userId = socket.user._id.toString()

      // Check if match exists
      if (!activeMatches.has(matchId)) {
        socket.emit("error", { message: "Match not found" })
        return
      }

      // Broadcast progress to match room (excluding sender)
      socket.to(matchId).emit("opponent_progress", {
        userId,
        progress,
      })
    })

    // Handle chat messages
    socket.on("send_message", (data) => {
      if (!socket.user) {
        socket.emit("error", { message: "Authentication required" })
        return
      }

      const { matchId, message } = data
      const userId = socket.user._id.toString()

      // Check if match exists
      if (!activeMatches.has(matchId)) {
        socket.emit("error", { message: "Match not found" })
        return
      }

      // Broadcast message to match room
      io.to(matchId).emit("new_message", {
        sender: {
          id: userId,
          username: socket.user.username,
        },
        message,
        timestamp: new Date(),
      })
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      // console.log("User disconnected:", socket.id)

      if (!socket.user) return

      const userId = socket.user._id.toString()

      // Remove from matchmaking queue
      matchmakingQueue = matchmakingQueue.filter((user) => user.id !== userId)

      // Handle active matches
      for (const [matchId, sockets] of activeMatches) {
        if (sockets.has(userId)) {
          sockets.delete(userId)

          // Notify opponent
          socket.to(matchId).emit("opponent_disconnected")

          // If no users left, remove match
          if (sockets.size === 0) {
            activeMatches.delete(matchId)
          }
        }
      }
    })
  })

  // Function to find a match for a user
  const findMatch = async (socket) => {
    if (matchmakingQueue.length < 2) return

    const userId = socket.user._id.toString()
    const userInQueue = matchmakingQueue.find((user) => user.id === userId)

    if (!userInQueue) return

    // Find a suitable opponent
    // In a real app, you would use a more sophisticated algorithm
    // For demo purposes, we'll just find the closest rating
    const sortedQueue = [...matchmakingQueue]
      .filter((user) => user.id !== userId)
      .sort((a, b) => {
        const ratingDiffA = Math.abs(a.rating - userInQueue.rating)
        const ratingDiffB = Math.abs(b.rating - userInQueue.rating)
        return ratingDiffA - ratingDiffB
      })

    if (sortedQueue.length === 0) return

    const opponent = sortedQueue[0]

    // Remove both users from queue
    matchmakingQueue = matchmakingQueue.filter((user) => user.id !== userId && user.id !== opponent.id)

    try {
      // Get a random problem
      const problemCount = await Problem.countDocuments()
      const random = Math.floor(Math.random() * problemCount)
      const problem = await Problem.findOne().skip(random)

      if (!problem) {
        throw new Error("No problems found")
      }

      // Create a new match
      const match = new Match({
        userA: userId,
        userB: opponent.id,
        problem: problem._id,
        status: "pending",
        startTime: new Date(),
      })

      await match.save()

      // Update user match history
      await Promise.all([
        User.findByIdAndUpdate(userId, { $push: { matchHistory: match._id } }),
        User.findByIdAndUpdate(opponent.id, { $push: { matchHistory: match._id } }),
      ])

      // Get opponent details
      const opponentUser = await User.findById(opponent.id).select("username rating")

      // Notify both users
      io.to(socket.id).emit("match_found", {
        matchId: match._id,
        opponent: {
          id: opponentUser._id,
          username: opponentUser.username,
          rating: opponentUser.rating,
        },
      })

      io.to(opponent.socketId).emit("match_found", {
        matchId: match._id,
        opponent: {
          id: socket.user._id,
          username: socket.user.username,
          rating: socket.user.rating,
        },
      })

      // console.log(`Match created between ${socket.user.username} and ${opponentUser.username}`)
    } catch (error) {
      console.error("Error creating match:", error)

      // Put users back in queue
      matchmakingQueue.push(userInQueue, opponent)

      // Notify users
      io.to(socket.id).emit("matchmaking_error", {
        message: "Error creating match. Please try again.",
      })

      io.to(opponent.socketId).emit("matchmaking_error", {
        message: "Error creating match. Please try again.",
      })
    }
  }

  // Periodically clean up inactive matches
  setInterval(
    () => {
      const now = new Date()

      for (const [matchId, sockets] of activeMatches) {
        // If match has been inactive for more than 1 hour, remove it
        if (now - sockets.lastActivity > 60 * 60 * 1000) {
          activeMatches.delete(matchId)
        }
      }
    },
    15 * 60 * 1000,
  ) // Run every 15 minutes
}

module.exports = { setupSocketHandlers }
