"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import {
  Menu,
  X,
  Code,
  Trophy,
  User,
  Settings,
  LogOut,
  Home,
  BookOpen,
  BarChart3,
  Bell,
  Clock,
  ChevronRight,
} from "lucide-react"

const Navbar = () => {
  const { currentUser, logout } = useAuth()
  const { connected } = useSocket()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const sidebarRef = useRef(null)

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && !event.target.closest(".navbar-toggle")) {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Add body class to prevent scrolling when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }

    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [isSidebarOpen])

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/")
      setIsSidebarOpen(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const isActiveLink = (path) => {
    return location.pathname === path
  }

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/practice", label: "Practice", icon: BookOpen },
    { path: "/matchmaking", label: "Find Duel", icon: Trophy },
    { path: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
    { path: "/match/history", label: "Match History", icon: Clock },
    { path: "/trophy-history", label: "Trophy History", icon: Trophy },
  ]

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile: Menu on left, Logo on right */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="navbar-toggle inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Logo - centered on mobile */}
          <div className="flex items-center justify-center md:justify-start">
            <Link
              to={currentUser ? "/dashboard" : "/"}
              className="flex items-center space-x-2 text-white hover:text-purple-400 transition-colors"
            >
              <Code className="h-8 w-8 text-purple-400" />
              <span className="text-xl font-bold">CodeClash</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {currentUser &&
                navLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                        isActiveLink(link.path)
                          ? "bg-purple-600 text-white shadow-lg"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            {currentUser && (
              <div className="hidden md:flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
                  title={connected ? "Connected" : "Disconnected"}
                ></div>
                <span className="text-xs text-gray-400">{connected ? "Online" : "Offline"}</span>
              </div>
            )}

            {/* Notifications */}
            {currentUser && (
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            )}

            {currentUser ? (
              <>
                {/* User Profile Button */}
                <div className="relative">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="navbar-toggle flex items-center space-x-3 text-gray-300 hover:text-white transition-colors p-2 rounded-md hover:bg-gray-700"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-sm font-bold">
                      {currentUser.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">{currentUser.username}</div>
                      <div className="text-xs text-gray-400">Rating: {currentUser.rating || 1200}</div>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/auth/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity">
          <div
            ref={sidebarRef}
            className="fixed inset-y-0 left-0 max-w-xs w-full bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out"
            style={{ width: "280px" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-lg font-bold">
                  {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <div className="font-medium text-white">{currentUser?.username || "Guest"}</div>
                  {currentUser && <div className="text-xs text-gray-400">Rating: {currentUser.rating || 1200}</div>}
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4">
              {currentUser ? (
                <>
                  {/* Navigation Links */}
                  <div className="px-2 space-y-1">
                    {navLinks.map((link) => {
                      const Icon = link.icon
                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          className={`flex items-center justify-between px-3 py-3 rounded-md text-base transition-colors ${
                            isActiveLink(link.path)
                              ? "bg-purple-600 text-white"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          }`}
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          <div className="flex items-center">
                            <Icon className="h-5 w-5 mr-3" />
                            <span>{link.label}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        </Link>
                      )
                    })}
                  </div>

                  {/* Connection Status */}
                  <div className="px-4 py-3 mt-4 border-t border-b border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-400">Connection Status</div>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"} mr-2`}></div>
                      <span className="text-sm text-gray-300">{connected ? "Online" : "Offline"}</span>
                    </div>
                  </div>

                  {/* User Actions */}
                  <div className="px-2 pt-4 space-y-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-3 py-3 rounded-md text-base text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <User className="h-5 w-5 mr-3" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-3 py-3 rounded-md text-base text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <Settings className="h-5 w-5 mr-3" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-3 rounded-md text-base text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-2 space-y-2">
                  <Link
                    to="/auth/login"
                    className="flex items-center px-3 py-3 rounded-md text-base text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <User className="h-5 w-5 mr-3" />
                    Sign In
                  </Link>
                  <Link
                    to="/auth/register"
                    className="flex items-center px-3 py-3 rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <User className="h-5 w-5 mr-3" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
              <div className="flex items-center justify-center">
                <Code className="h-5 w-5 text-purple-400 mr-2" />
                <span className="text-sm text-gray-400">CodeClash v1.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
