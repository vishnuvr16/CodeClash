const express = require("express")
const jwt = require("jsonwebtoken")
const axios = require("axios")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")
const crypto = require("crypto")
const rateLimit = require("express-rate-limit")

const router = express.Router()

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: { message: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiting for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 accounts per hour
  message: { message: "Too many accounts created, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
})

// Register a new user
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      })
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      })
    }

    // Username validation (alphanumeric + underscore)
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message: "Username can only contain letters, numbers, and underscores",
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or username already exists",
      })
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    })

    await user.save()

    res.status(201).json({
      message: "User registered successfully",
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      message: "Server error during registration",
    })
  }
})

// Login user
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      })
    }

    // Find user by email
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      })
    }

    // Check if account is locked
    if (user.accountLocked) {
      return res.status(401).json({
        message: "Account is locked due to too many failed login attempts. Please reset your password.",
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1

      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.accountLocked = true
      }

      await user.save()

      return res.status(401).json({
        message: "Invalid email or password",
      })
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0
    user.accountLocked = false
    user.lastLogin = {
      date: new Date(),
      ip: clientIp,
    }
    await user.save()

    // Create JWT token with appropriate expiration
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your_jwt_secret", { expiresIn: "7d" })

    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      trophies: user.trophies,
      profilePicture: user.profilePicture,
    }

    res.status(200).json({
      token,
      user: userData,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      message: "Server error during login",
    })
  }
})

// Google OAuth callback with enhanced security
router.post("/google/callback", async (req, res) => {
  try {
    const { code, redirectUri } = req.body
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress

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
    } else if (!user.googleId) {
      // If user exists but doesn't have googleId, update it
      user.googleId = googleId
      user.profilePicture = picture || user.profilePicture
      await user.save()
    }

    // Update last login information
    user.lastLogin = {
      date: new Date(),
      ip: clientIp,
    }
    await user.save()

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your_jwt_secret", { expiresIn: "7d" })

    // Return user data
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      trophies: user.trophies,
      profilePicture: user.profilePicture,
    }

    res.status(200).json({
      token,
      user: userData,
    })
  } catch (error) {
    console.error("Google OAuth error:", error.response?.data || error.message)
    res.status(500).json({
      message: "Server error during Google authentication",
      error: error.message,
    })
  }
})

// Verify token and get current user
router.get("/verify", authenticateToken, async (req, res) => {
  try {
    res.status(200).json({
      user: req.user,
    })
  } catch (error) {
    console.error("Token verification error:", error)
    res.status(500).json({
      message: "Server error during token verification",
    })
  }
})

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body
    const userId = req.user._id

    // Input validation
    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_]+$/
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          message: "Username can only contain letters, numbers, and underscores",
        })
      }
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email format",
        })
      }
    }

    // Check if username or email is already taken
    if (username || email) {
      const existingUser = await User.findOne({
        $and: [{ _id: { $ne: userId } }, { $or: [{ username: username || "" }, { email: email || "" }] }],
      })

      if (existingUser) {
        return res.status(400).json({
          message: "Username or email is already taken",
        })
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, { $set: { username, email } }, { new: true }).select(
      "-password",
    )

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    res.status(500).json({
      message: "Server error during profile update",
    })
  }
})

// Change password with security checks
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user._id

    // Input validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters long",
      })
    }

    // Get user with password
    const user = await User.findById(userId)

    // Check if user has a password (might be using Google auth)
    if (!user.password) {
      return res.status(400).json({
        message: "You don't have a password set. You're using a social login.",
      })
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.status(200).json({
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Password change error:", error)
    res.status(500).json({
      message: "Server error during password change",
    })
  }
})

// Request password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      // Don't reveal that the user doesn't exist
      return res.status(200).json({
        message: "If your email is registered, you will receive a password reset link",
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
    await user.save()

    // In a real application, send an email with the reset link
    // For now, just return the token for testing
    res.status(200).json({
      message: "If your email is registered, you will receive a password reset link",
      // Only include token in development
      ...(process.env.NODE_ENV !== "production" && { resetToken }),
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({
      message: "Server error during password reset request",
    })
  }
})

// Reset password with token
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      })
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        message: "Password reset token is invalid or has expired",
      })
    }

    // Update password and clear reset token
    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    user.accountLocked = false
    user.failedLoginAttempts = 0
    await user.save()

    res.status(200).json({
      message: "Password has been reset successfully",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({
      message: "Server error during password reset",
    })
  }
})

module.exports = router
