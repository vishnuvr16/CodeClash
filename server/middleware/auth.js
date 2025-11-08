const jwt = require("jsonwebtoken")
const User = require("../models/User")
const rateLimit = require("express-rate-limit")

const JWT_SECRET = process.env.JWT_SECRET
// if (!JWT_SECRET || JWT_SECRET.length < 32) {
//   throw new Error("JWT_SECRET must be at least 32 characters long")
// }

// Rate limiting for authentication attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: { error: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
})

// Middleware to authenticate JWT token from HTTP-only cookies
const authenticateToken = async (req, res, next) => {
  try {

    const token = req.cookies?.authToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        error: "Access denied",
        message: "No authentication token provided",
      })
    }

    // Verify token with enhanced security
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      // Clear invalid cookie
      res.clearCookie("authToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      })

      // if (error.name === "TokenExpiredError") {
      //   return res.status(401).json({
      //     error: "Token expired",
      //     message: "Please login again",
      //   })
      // }
      // if (error.name === "JsonWebTokenError") {
      //   return res.status(401).json({
      //     error: "Invalid token",
      //     message: "Authentication failed",
      //   })
      // }
      // return res.status(401).json({
      //   error: "Token verification failed",
      //   message: "Authentication error",
      // })
    }

    const user = await User.findById(decoded.id).select("-password -__v")

    if (!user) {
      // Clear cookie for non-existent user
      res.clearCookie("authToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      })
      return res.status(401).json({
        error: "User not found",
        message: "Invalid authentication",
      })
    }

    // Check if account is locked or suspended
    if (user.accountLocked) {
      return res.status(403).json({
        error: "Account locked",
        message: "Your account has been locked. Please contact support.",
      })
    }

    if (user.suspended) {
      return res.status(403).json({
        error: "Account suspended",
        message: "Your account has been suspended. Please contact support.",
      })
    }

    // Check for token issued before password change
    if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
      res.clearCookie("authToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      })
      return res.status(401).json({
        error: "Token invalid",
        message: "Please login again after password change",
      })
    }

    // Add user to request object
    req.user = user
    next()
  } catch (error) {
    console.error("Authentication error:", {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    })
    return res.status(500).json({
      error: "Server error",
      message: "Authentication service unavailable",
    })
  }
}

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles || !req.user.roles.includes("admin")) {
    return res.status(403).json({
      error: "Access denied",
      message: "Admin privileges required",
    })
  }
  next()
}

// Enhanced input sanitization middleware
const sanitizeInputs = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        // Remove potentially dangerous content
        req.body[key] = req.body[key]
          // Remove script tags
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          // Remove javascript: protocol
          .replace(/javascript:/gi, "")
          // Remove on* event handlers
          .replace(/on\w+\s*=/gi, "")
          // Remove data: URLs (except images)
          .replace(/data:(?!image\/)/gi, "")
          // Remove vbscript: protocol
          .replace(/vbscript:/gi, "")
          // Remove expression() CSS
          .replace(/expression\s*\(/gi, "")
          // Remove @import CSS
          .replace(/@import/gi, "")
          // Limit length to prevent DoS
          .substring(0, 10000)
      }
    }
  }

  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === "string") {
        req.query[key] = req.query[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "")
          .substring(0, 1000)
      }
    }
  }

  next()
}

// Middleware to validate request origin
const validateOrigin = (req, res, next) => {
  const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:3000",
  ]

  const origin = req.get("Origin") || req.get("Referer")

  if (origin && !allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Request from unauthorized origin",
    })
  }

  next()
}

// Middleware to log security events
const logSecurityEvent = (eventType, req, additionalInfo = {}) => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    eventType,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    ...additionalInfo,
  }

  // console.warn("SECURITY EVENT:", securityLog)
}

// Utility function to generate secure tokens
const generateSecureToken = (payload, expiresIn = "24h") => {
  return jwt.sign(
    {
      ...payload,
      iss: process.env.JWT_ISSUER || "peerprep-duel",
      aud: process.env.JWT_AUDIENCE || "peerprep-users",
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    {
      expiresIn,
      algorithm: "HS256",
    },
  )
}

// Utility function to set secure cookie
const setSecureCookie = (res, name, value, options = {}) => {
  const defaultOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    ...options,
  }

  res.cookie(name, value, defaultOptions)
}

// Utility function to clear secure cookie
const clearSecureCookie = (res, name) => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  })
}

module.exports = {
  authenticateToken,
  isAdmin,
  sanitizeInputs,
  validateOrigin,
  authLimiter,
  logSecurityEvent,
  generateSecureToken,
  setSecureCookie,
  clearSecureCookie,
}
