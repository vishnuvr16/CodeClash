"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Trophy,
  Code,
  Home,
  BookOpen,
  BarChart3,
  Clock,
  ChevronRight,
} from "lucide-react"

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)
  const menuRef = useRef(null)
  const sidebarRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate("/")
    setIsProfileOpen(false)
    setIsMenuOpen(false)
    setIsSidebarOpen(false)
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
    setIsProfileOpen(false)
    setIsSidebarOpen(false)
  }, [location.pathname])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
      if (menuRef.current && !menuRef.current.contains(event.target) && isMenuOpen) {
        setIsMenuOpen(false)
      }
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest(".mobile-menu-btn")
      ) {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMenuOpen, isSidebarOpen])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isSidebarOpen])

  const isActiveRoute = (path) => {
    return location.pathname === path
  }

  const NavLink = ({ to, children, icon: Icon, mobile = false, sidebar = false }) => {
    const active = isActiveRoute(to)

    if (sidebar) {
      return (
        <Link
          to={to}
          className={`flex items-center justify-between px-4 py-3 text-base font-medium transition-colors duration-200 rounded-lg mx-2 ${
            active ? "text-white bg-purple-600" : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="flex items-center">
            {Icon && <Icon className="mr-3 h-5 w-5" />}
            {children}
          </div>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </Link>
      )
    }

    const baseClasses = mobile
      ? "flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 w-full"
      : "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"

    const activeClasses = active
      ? mobile
        ? "text-white bg-purple-600 border-r-4 border-purple-300"
        : "text-white bg-purple-600"
      : mobile
        ? "text-gray-300 hover:text-white hover:bg-gray-700"
        : "text-gray-300 hover:text-white hover:bg-gray-700"

    return (
      <Link to={to} className={`${baseClasses} ${activeClasses}`} onClick={() => mobile && setIsMenuOpen(false)}>
        {Icon && <Icon className={mobile ? "mr-3 h-5 w-5" : "mr-2 h-4 w-4"} />}
        {children}
      </Link>
    )
  }

  const sidebarLinks = [
    { to: "/dashboard", label: "Dashboard", icon: Home },
    { to: "/practice", label: "Practice", icon: BookOpen },
    { to: "/matchmaking", label: "Find Duel", icon: Trophy },
    { to: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
    { to: "/match/history", label: "Match History", icon: Clock },
    { to: "/trophy-history", label: "Trophy History", icon: Trophy },
  ]

  return (
    <>
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Mobile Layout: Menu button on left */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="mobile-menu-btn inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
                aria-expanded={isSidebarOpen}
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="block h-6 w-6" />
              </button>
            </div>

            {/* Desktop Layout: Logo on left */}
            <div className="hidden md:flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                    <Code className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">
                    Code<span className="text-purple-400">Clash</span>
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="ml-8 flex space-x-1">
                <NavLink to="/" icon={Home}>
                  Home
                </NavLink>
                <NavLink to="/leaderboard" icon={Trophy}>
                  Leaderboard
                </NavLink>
                {isAuthenticated && (
                  <>
                    <NavLink to="/dashboard" icon={User}>
                      Dashboard
                    </NavLink>
                    <NavLink to="/practice" icon={Code}>
                      Practice
                    </NavLink>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Layout: Brand name on right */}
            <div className="flex md:hidden items-center">
              <Link to="/" className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                    <Code className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">
                    Code<span className="text-purple-400">Clash</span>
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {isAuthenticated ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-all duration-200 hover:bg-gray-800 px-3 py-2"
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mr-3">
                      <span className="text-white font-medium text-sm">
                        {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-gray-300 font-medium">{currentUser?.username}</span>
                      <span className="text-xs text-gray-500">Rating: {currentUser?.trophies || 1200}</span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm text-gray-300">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">{currentUser?.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="mr-3 h-4 w-4" />
                        Profile & Stats
                      </Link>
                      <Link
                        to="/practice"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Code className="mr-3 h-4 w-4" />
                        Practice Problems
                      </Link>
                      <Link
                        to="/trophy-history"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Trophy className="mr-3 h-4 w-4" />
                        History
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors border-t border-gray-700 mt-1"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

          {/* Sidebar */}
          <div
            ref={sidebarRef}
            className="fixed inset-y-0 left-0 max-w-xs w-full bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out"
            style={{ width: "280px" }}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                {isAuthenticated ? (
                  <>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-white">{currentUser?.username || "Guest"}</div>
                      <div className="text-xs text-gray-400">Rating: {currentUser?.trophies || 1200}</div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                      <Code className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">
                      Code<span className="text-purple-400">Clash</span>
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="py-4 flex-1 overflow-y-auto">
              {isAuthenticated ? (
                <>
                  {/* Navigation Links */}
                  <div className="space-y-1 mb-6">
                    {sidebarLinks.map((link) => (
                      <NavLink key={link.to} to={link.to} icon={link.icon} sidebar>
                        {link.label}
                      </NavLink>
                    ))}
                  </div>

                  {/* User Actions */}
                  <div className="border-t border-gray-700 pt-4 space-y-1">
                    <Link
                      to="/settings"
                      className="flex items-center justify-between px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors rounded-lg mx-2"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <div className="flex items-center">
                        <Settings className="mr-3 h-5 w-5" />
                        Settings
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center justify-between px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors rounded-lg mx-2"
                    >
                      <div className="flex items-center">
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign out
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2 px-2">
                  <Link
                    to="/login"
                    className="flex items-center justify-center px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors rounded-lg"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <User className="mr-3 h-5 w-5" />
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center px-4 py-3 text-base font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all duration-200 rounded-lg"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <User className="mr-3 h-5 w-5" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="border-t border-gray-700 p-4">
              <div className="flex items-center justify-center text-sm text-gray-400">
                <Code className="h-4 w-4 text-purple-400 mr-2" />
                CodeClash v1.0
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
