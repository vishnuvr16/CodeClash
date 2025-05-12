"use client"

import { createContext, useState, useContext, useEffect } from "react"
import { toast } from "react-toastify"
import api from "../utils/api"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem("token") || "")

  // Check if user is authenticated on initial load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get("/auth/verify")
        setCurrentUser(response.data.user)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Token verification failed:", error)
        localStorage.removeItem("token")
        setToken("")
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  // Register a new user
  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData)
      toast.success("Registration successful! Please log in.")
      return response.data
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed"
      toast.error(message)
      throw error
    }
  }

  // Login user
  const login = async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials)
      const { token, user } = response.data

      localStorage.setItem("token", token)
      setToken(token)
      setCurrentUser(user)
      setIsAuthenticated(true)

      toast.success("Login successful!")
      return user
    } catch (error) {
      const message = error.response?.data?.message || "Login failed"
      toast.error(message)
      throw error
    }
  }

  // Login with Google (using authorization code)
  const loginWithGoogleCode = async (code) => {
    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`
      const response = await api.post("/auth/google/callback", {
        code,
        redirectUri,
      })

      const { token, user } = response.data

      localStorage.setItem("token", token)
      setToken(token)
      setCurrentUser(user)
      setIsAuthenticated(true)

      toast.success("Google login successful!")
      return user
    } catch (error) {
      const message = error.response?.data?.message || "Google login failed"
      toast.error(message)
      throw error
    }
  }

  // Logout user
  const logout = () => {
    localStorage.removeItem("token")
    setToken("")
    setCurrentUser(null)
    setIsAuthenticated(false)
    toast.info("You have been logged out")
  }

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await api.put("/auth/profile", userData)
      setCurrentUser(response.data.user)
      toast.success("Profile updated successfully")
      return response.data.user
    } catch (error) {
      const message = error.response?.data?.message || "Profile update failed"
      toast.error(message)
      throw error
    }
  }

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await api.put("/auth/change-password", passwordData)
      toast.success("Password changed successfully")
    } catch (error) {
      const message = error.response?.data?.message || "Password change failed"
      toast.error(message)
      throw error
    }
  }

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    register,
    login,
    loginWithGoogleCode,
    logout,
    updateProfile,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
