const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." })
    }

    // Verify token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret")
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired. Please login again." })
      }
      return res.status(401).json({ message: "Invalid token." })
    }

    // Find user by id
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return res.status(401).json({ message: "Invalid token. User not found." })
    }

    // Check if account is locked
    if (user.accountLocked) {
      return res.status(403).json({ message: "Account is locked. Please reset your password." })
    }

    // Add user to request object
    req.user = user
    next()
  } catch (error) {
    console.error("Authentication error:", error)
    return res.status(500).json({ message: "Server error during authentication." })
  }
}

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles || !req.user.roles.includes("admin")) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." })
  }
  next()
}

// Middleware to sanitize inputs
const sanitizeInputs = (req, res, next) => {
  // Simple sanitization for common XSS attacks
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        // Replace script tags and other potentially harmful content
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+=/gi, "")
      }
    }
  }
  next()
}

module.exports = { authenticateToken, isAdmin, sanitizeInputs }
