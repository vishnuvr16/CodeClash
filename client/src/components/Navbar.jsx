import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import {
  Menu,
  ChevronDown,
  LogOut,
  User,
  Trophy,
  Code,
  Home,
  BookOpen,
  BarChart3,
  Clock,
  ChevronRight,
  Wifi,
  WifiOff,
} from "lucide-react"

// Helper component for NavLink
// This component should exist or be defined elsewhere in your project.
// Including it here for completeness based on your provided Navbar code.
const NavLink = ({ to, children, icon: Icon, mobile = false, sidebar = false }) => {
  const location = useLocation(); // Get location inside NavLink
  const isActiveRoute = (path) => location.pathname === path;
  const active = isActiveRoute(to);

  if (sidebar) {
    return (
      <Link
        to={to}
        className={`flex items-center justify-between px-4 py-3 text-base font-medium transition-colors duration-200 rounded-lg mx-2 ${
          active ? "text-white bg-purple-600" : "text-gray-300 hover:text-white hover:bg-gray-700"
        }`}
        // onClick prop for sidebar links is handled in Navbar if you want to close sidebar on click
      >
        <div className="flex items-center">
          {Icon && <Icon className="mr-3 h-5 w-5" />}
          {children}
        </div>
        <ChevronRight className="h-4 w-4 opacity-50" />
      </Link>
    );
  }

  const baseClasses = mobile
    ? "flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 w-full"
    : "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";

  const activeClasses = active
    ? mobile
      ? "text-white bg-purple-600 border-r-4 border-purple-300"
      : "text-white bg-purple-600"
    : mobile
      ? "text-gray-300 hover:text-white hover:bg-gray-700"
      : "text-gray-300 hover:text-white hover:bg-gray-700";

  return (
    <Link to={to} className={`${baseClasses} ${activeClasses}`} /* onClick for mobile menu closure can be added here */>
      {Icon && <Icon className={mobile ? "mr-3 h-5 w-5" : "mr-2 h-4 w-4"} />}
      {children}
    </Link>
  );
};


const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
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

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false)
    setIsProfileOpen(false)
    setIsSidebarOpen(false)
  }, [location.pathname])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close profile dropdown if click is outside its ref area
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }

      // Close main menu dropdown if click is outside its ref area
      if (menuRef.current && !menuRef.current.contains(event.target) && isMenuOpen) {
        setIsMenuOpen(false)
      }

      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isSidebarOpen &&
        !event.target.closest(".mobile-menu-btn")
      ) {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isProfileOpen, isMenuOpen, isSidebarOpen]) 

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset" // Changed from "" to "unset" for better practice
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isSidebarOpen])

  const isActiveRoute = (path) => {
    return location.pathname === path
  }

  // Fix: Create a separate click handler for sidebar links
  const handleSidebarLinkClick = () => {
    setIsSidebarOpen(false)
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
          onClick={handleSidebarLinkClick} // Use the separate handler
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
      : "flex items-center px-3 py-2 rounded-md text-sm font-medium "

    const activeClasses = active
      ? mobile
        ? "text-white bg-purple-600 border-r-4 border-purple-300"
        : "text-white bg-purple-600"
      : mobile
        ? "text-gray-300 hover:text-white hover:bg-gray-700"
        : "text-gray-300 hover:text-white hover:bg-gray-700"

    return (
      <Link 
        to={to} 
        className={`${baseClasses} ${activeClasses}`} 
        onClick={() => mobile && setIsMenuOpen(false)}
      >
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
    { to: "/profile", label: "My Profile", icon: User },
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
              {/* Online/Offline Status */}
              <div className="flex items-center mr-2">
                {isOnline ? (
                  <div className="flex items-center text-green-400 text-xs">
                    <Wifi className="h-4 w-4 mr-1" />
                    <span>Online</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-400 text-xs">
                    <WifiOff className="h-4 w-4 mr-1" />
                    <span>Offline</span>
                  </div>
                )}
              </div>

              {isAuthenticated ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-all duration-200 hover:bg-gray-800 px-3 py-1"
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mr-3">
                      {currentUser?.profilePicture ? (
                        <img
                          src={currentUser.profilePicture}
                          alt={currentUser.username}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        
                      ) : (
                        <span className="text-white font-medium text-sm">
                          {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-gray-300 font-medium">{currentUser?.username}</span>
                      <span className="text-xs text-gray-500">Trophies: {currentUser?.trophies || 1200}</span>
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
                        to="/profile"
                        className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="mr-3 h-4 w-4" />
                        Profile & Stats
                      </Link>
                      <Link
                        to="/practice"
                        className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Code className="mr-3 h-4 w-4" />
                        Practice Problems
                      </Link>
                      <Link
                        to="/trophy-history"
                        className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Trophy className="mr-3 h-4 w-4" />
                        Trophy History
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
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setIsSidebarOpen(false)}>
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

          {/* Sidebar */}
          <div
            ref={sidebarRef}
            className="fixed inset-y-0 left-0 max-w-xs w-full bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out"
            style={{ width: "280px" }}
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside sidebar from closing it
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                {isAuthenticated ? (
                  <>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      {currentUser?.profilePicture ? (
                        <img
                          src={currentUser.profilePicture || "/placeholder.svg"}
                          alt={currentUser.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium text-lg">
                          {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">{currentUser?.username || "Guest"}</div>
                      <div className="text-xs text-gray-400 flex items-center">
                        <span className="mr-2">Rating: {currentUser?.trophies || 1200}</span>
                        {isOnline ? (
                          <div className="flex items-center text-green-400">
                            <Wifi className="h-3 w-3 mr-1" />
                            <span>Online</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-400">
                            <WifiOff className="h-3 w-3 mr-1" />
                            <span>Offline</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="font-medium text-white">Guest</div>
                )}
              </div>
            </div>

            {/* Sidebar Content */}
            <nav className="mt-4">
              <div>
                {sidebarLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} icon={link.icon} sidebar onClick={() => setIsSidebarOpen(false)}>
                    {link.label}
                  </NavLink>
                ))}
                {!isAuthenticated && (
                  <NavLink to="/login" icon={User} sidebar onClick={() => setIsSidebarOpen(false)}>
                    Login
                  </NavLink>
                )}
                {isAuthenticated && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-between px-4 py-3 text-base font-medium transition-colors duration-200 rounded-lg mx-2 text-gray-300 hover:text-white hover:bg-gray-700 w-full"
                  >
                    <div className="flex items-center">
                      <LogOut className="mr-3 h-5 w-5" />
                      Sign Out
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar