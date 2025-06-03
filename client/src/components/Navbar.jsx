"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Menu, X, ChevronDown, LogOut, User, Settings, Trophy, Code } from "lucide-react"

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)
  const menuRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate("/")
    setIsProfileOpen(false)
    setIsMenuOpen(false)
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
    setIsProfileOpen(false)
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
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMenuOpen])

  const isActiveRoute = (path) => {
    return location.pathname === path
  }

  const NavLink = ({ to, children, icon: Icon, mobile = false }) => {
    const active = isActiveRoute(to)
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

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
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
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              <NavLink to="/" icon={null}>
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
                    <span className="text-xs text-gray-500">Rating: {currentUser?.rating || 1200}</span>
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
                      className=" px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="mr-3 h-4 w-4" />
                      Profile & Stats
                    </Link>
                    <Link
                      to="/practice"
                      className=" px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Code className="mr-3 h-4 w-4" />
                      Practice Problems
                    </Link>
                    <Link
                      to="/trophy-history"
                      className=" px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Trophy className="mr-3 h-4 w-4" />
                      History
                    </Link>
                    <Link
                      to="/settings"
                      className=" px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors"
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

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-200 ease-in-out ${isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
        id="mobile-menu"
        ref={menuRef}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-800 border-t border-gray-700">
          <NavLink to="/" mobile>
            Home
          </NavLink>
          <NavLink to="/leaderboard" icon={Trophy} mobile>
            Leaderboard
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" icon={User} mobile>
                Dashboard
              </NavLink>
              <NavLink to="/practice" icon={Code} mobile>
                Practice
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile Auth Section */}
        <div className="pt-4 pb-3 border-t border-gray-700 bg-gray-800">
          {isAuthenticated ? (
            <>
              <div className="flex items-center px-4 mb-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="text-base font-medium text-white">{currentUser?.username}</div>
                  <div className="text-sm text-gray-400">{currentUser?.email}</div>
                  <div className="text-xs text-purple-400">Rating: {currentUser?.rating || 1200}</div>
                </div>
              </div>
              <div className="space-y-1 px-2">
                <Link
                  to="/settings"
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors rounded-md w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="mr-3 h-5 w-5" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors rounded-md"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col space-y-2 px-4">
              <Link
                to="/login"
                className="w-full text-center block px-4 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="w-full text-center block px-4 py-3 rounded-md text-base font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
