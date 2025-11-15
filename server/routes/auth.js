const express = require("express")
const router = express.Router()
const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const axios = require("axios")
const crypto = require("crypto")
const {
  authenticateToken,
  sanitizeInputs,
  validateOrigin,
  authLimiter,
  logSecurityEvent,
  generateSecureToken,
  setSecureCookie,
  clearSecureCookie,
} = require("../middleware/auth")
const rateLimit = require("express-rate-limit")

// Enhanced rate limiting for sensitive operations
// const strictAuthLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 3, // Only 3 attempts per 15 minutes
//   message: { error: "Too many attempts, please try again later" },
//   standardHeaders: true,
//   legacyHeaders: false,
// })

// Input validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
  return usernameRegex.test(username)
}

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/
  return passwordRegex.test(password)
}

// Register a new user with enhanced security
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" })
    }

    const user = await User.create({
      username,
      email,
      password
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })

    res.json({
      message: "User Registered successfully",
      token: token,
      user: { id: user._id, username: user.username, email: user.email },
    })
  } catch (err) {
    console.error("Register error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })

    // Send cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })

    res.json({
      message: "Login successful",
      token: token,
      user: { id: user._id, username: user.username, email: user.email },
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Google OAuth callback
router.post("/google/callback", async (req, res) => {
  try {
    const { code, redirectUri } = req.body

    if (!code) {
      return res.status(400).json({
        message: "Authorization code is required",
      })
    }

    // Exchange the code for tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    const { access_token, id_token } = tokenResponse.data

    // Get user info with the access token
    const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const { sub: googleId, email, name, picture } = userInfoResponse.data

    // Check if user exists
    let user = await User.findOne({ email })

    if (!user) {
      // Create new user if not exists
      // Generate a unique username based on name
      let username = name.replace(/\s+/g, "").toLowerCase()
      let usernameExists = await User.findOne({ username })
      let counter = 1

      // If username exists, append a number until we find a unique one
      while (usernameExists) {
        username = `${name.replace(/\s+/g, "").toLowerCase()}${counter}`
        usernameExists = await User.findOne({ username })
        counter++
      }

      user = new User({
        username,
        email,
        googleId,
        profilePicture: picture,
      })

      await user.save()

      // console.log("Created new user via Google OAuth:", user)
    } else if (!user.googleId) {
      // If user exists but doesn't have googleId, update it
      user.googleId = googleId
      user.profilePicture = picture || user.profilePicture
      await user.save()
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your_jwt_secret", { expiresIn: "7d" })

    const cookieMaxAge =  24 * 60 * 60 * 1000
    
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      rating: user.trophies,
      profilePicture: user.profilePicture,
    }

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: cookieMaxAge,
      path: "/",
    })

    logSecurityEvent("SUCCESSFUL_LOGIN", req, { userId: user._id, email: user.email })

    res.json({
      success: true,
      token: token,
      user: userData,
    })
  } catch (error) {
    // console.error("Google OAuth error:", error.response?.data || error.message)
    res.status(500).json({
      message: "Server error during Google authentication",
      error: error.message,
    })
  }
})

// Verify token route
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Token is valid",
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      trophies: req.user.trophies,
      tier: req.user.tier,
      profilePicture: req.user.profilePicture,
    },
  })
})

// Logout route
router.post("/logout", authenticateToken, (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  })

  logSecurityEvent("USER_LOGOUT", req, { userId: req.user._id })

  res.json({
    success: true,
    message: "Logged out successfully",
  })
})

// Change password with enhanced security
router.put("/change-password", authenticateToken, sanitizeInputs, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "Invalid input",
        message: "All password fields are required",
      })
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error: "Weak password",
        message: "New password must be 8-128 characters with uppercase, lowercase, number, and special character",
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: "Password mismatch",
        message: "New passwords do not match",
      })
    }

    const user = await User.findById(req.user._id)

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password)
    if (!validPassword) {
      logSecurityEvent("INVALID_PASSWORD_CHANGE_ATTEMPT", req, { userId: user._id })
      return res.status(401).json({
        error: "Invalid password",
        message: "Current password is incorrect",
      })
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password and timestamp
    user.password = hashedPassword
    user.passwordChangedAt = new Date()
    await user.save()

    // Clear all existing sessions by clearing cookie
    clearSecureCookie(res, "authToken")

    logSecurityEvent("PASSWORD_CHANGED", req, { userId: user._id })

    res.json({
      success: true,
      message: "Password changed successfully. Please login again.",
    })
  } catch (error) {
    // console.error("Password change error:", error)
    logSecurityEvent("PASSWORD_CHANGE_ERROR", req, { error: error.message })
    res.status(500).json({
      error: "Password change failed",
      message: "Unable to change password. Please try again.",
    })
  }
})

// Update profile with security checks
router.put("/profile", authenticateToken, sanitizeInputs, async (req, res) => {
  try {
    const { username, email } = req.body
    const userId = req.user._id

    const updateData = {}

    // Validate and update username if provided
    if (username && username !== req.user.username) {
      if (!validateUsername(username)) {
        return res.status(400).json({
          error: "Invalid username",
          message: "Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores",
        })
      }

      // Check if username is taken
      const existingUser = await User.findOne({
        username: { $regex: new RegExp(`^${username}$`, "i") },
        _id: { $ne: userId },
      })

      if (existingUser) {
        return res.status(409).json({
          error: "Username taken",
          message: "Username is already taken",
        })
      }

      updateData.username = username.toLowerCase()
    }

    // Validate and update email if provided
    if (email && email !== req.user.email) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          error: "Invalid email",
          message: "Please provide a valid email address",
        })
      }

      // Check if email is taken
      const existingUser = await User.findOne({
        email: { $regex: new RegExp(`^${email}$`, "i") },
        _id: { $ne: userId },
      })

      if (existingUser) {
        return res.status(409).json({
          error: "Email taken",
          message: "Email is already taken",
        })
      }

      updateData.email = email.toLowerCase()
      updateData.emailVerified = false // Require re-verification
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No changes",
        message: "No valid changes provided",
      })
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, select: "-password -__v" })

    logSecurityEvent("PROFILE_UPDATED", req, {
      userId,
      changes: Object.keys(updateData),
    })

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    // console.error("Profile update error:", error)
    logSecurityEvent("PROFILE_UPDATE_ERROR", req, { error: error.message })
    res.status(500).json({
      error: "Profile update failed",
      message: "Unable to update profile. Please try again.",
    })
  }
})

// Username availability check with rate limiting
router.get(
  "/check-username",
  // rateLimit({
  //   windowMs: 60 * 1000, // 1 minute
  //   max: 10, // 10 checks per minute
  //   message: { error: "Too many username checks, please slow down" },
  // }),
  async (req, res) => {
    try {
      const { username } = req.query

      if (!username || !validateUsername(username)) {
        return res.json({ available: false, reason: "Invalid format" })
      }

      const existingUser = await User.findOne({
        username: { $regex: new RegExp(`^${username}$`, "i") },
      })

      res.json({
        available: !existingUser,
        reason: existingUser ? "Username taken" : "Available",
      })
    } catch (error) {
      // console.error("Username check error:", error)
      res.status(500).json({ available: false, reason: "Check failed" })
    }
  },
)

module.exports = router
