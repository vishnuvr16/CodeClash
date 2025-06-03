const express = require("express")
const jwt = require("jsonwebtoken")
const axios = require("axios")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

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
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      })
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your_jwt_secret", { expiresIn: "7d" })

    // Return user data without password
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      rating: user.rating,
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
    } else if (!user.googleId) {
      // If user exists but doesn't have googleId, update it
      user.googleId = googleId
      user.profilePicture = picture || user.profilePicture
      await user.save()
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your_jwt_secret", { expiresIn: "7d" })

    // Return user data
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      rating: user.rating,
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

// Change password
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user._id

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

module.exports = router
