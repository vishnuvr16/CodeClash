import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import {
  Code,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Tag,
  Trophy,
  Target,
  BookOpen,
  Play,
  Star,
  Zap,
  Award,
  BarChart3,
  Users,
  Calendar,
} from "lucide-react"
import api from "../utils/api"
import { toast } from "react-toastify"

const PracticePage = () => {
  const { currentUser } = useAuth()

  const [problems, setProblems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProblems: 0,
  })
  const [availableTags, setAvailableTags] = useState([])
  const [userStats, setUserStats] = useState({
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    currentStreak: 0,
    longestStreak: 0,
  })

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const response = await api.get("/practice/stats")
      if (response.data && response.data.success) {
        const stats = response.data.stats
        setUserStats({
          totalSolved: stats.totalSolved || 0,
          easySolved: stats.easy?.solved || 0,
          mediumSolved: stats.medium?.solved || 0,
          hardSolved: stats.hard?.solved || 0,
          currentStreak: stats.currentStreak || 0,
          longestStreak: stats.longestStreak || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Build query parameters
        const queryParams = new URLSearchParams({
          page: pagination.currentPage,
          limit: 12,
          sortBy,
          order: sortOrder,
        })

        if (difficultyFilter !== "all") {
          queryParams.append("difficulty", difficultyFilter)
        }

        if (tagFilter !== "all") {
          queryParams.append("tags", tagFilter)
        }

        if (searchQuery) {
          queryParams.append("search", searchQuery)
        }

        const response = await api.get(`/practice/problems?${queryParams.toString()}`)

        if (response.data && response.data.success) {
          setProblems(response.data.problems || [])
          setPagination({
            currentPage: Number.parseInt(response.data.pagination?.currentPage || 1),
            totalPages: Number.parseInt(response.data.pagination?.totalPages || 1),
            totalProblems: Number.parseInt(response.data.pagination?.totalProblems || 0),
          })
        }

        // Fetch available tags if not already loaded
        if (availableTags.length === 0) {
          try {
            const tagsResponse = await api.get("/practice/tags")
            if (tagsResponse.data && tagsResponse.data.success) {
              setAvailableTags(tagsResponse.data.tags || [])
            }
          } catch (error) {
            console.error("Error fetching tags:", error)
          }
        }

        // Fetch user statistics
        if (currentUser) {
          await fetchUserStats()
        }
      } catch (error) {
        console.error("Error fetching problems:", error)
        setError("Failed to load problems. Please try again.")
        toast.error("Failed to load problems. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProblems()
  }, [
    pagination.currentPage,
    difficultyFilter,
    tagFilter,
    sortBy,
    sortOrder,
    searchQuery,
    availableTags.length,
    currentUser,
  ])

  // Calendar-based streak display
  const StreakCalendar = ({ currentStreak, longestStreak }) => {
    const [calendarData, setCalendarData] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      const fetchStreakData = async () => {
        try {
          const response = await api.get("/practice/streak-calendar")
          if (response.data && response.data.success) {
            setCalendarData(response.data.calendarData)
          }
        } catch (error) {
          console.error("Error fetching streak data:", error)
        } finally {
          setIsLoading(false)
        }
      }

      if (currentUser) {
        fetchStreakData()
      }
    }, [currentUser])

    if (isLoading) {
      return (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-10 gap-1 mb-4">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="w-6 h-6 bg-gray-700 rounded-sm"></div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    const getIntensityColor = (problemsSolved) => {
      if (problemsSolved === 0) return "bg-gray-700 text-gray-500"
      if (problemsSolved === 1) return "bg-green-800 text-white"
      if (problemsSolved === 2) return "bg-green-600 text-white"
      if (problemsSolved >= 3) return "bg-green-400 text-white"
      return "bg-gray-700 text-gray-500"
    }

    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Calendar className="h-5 w-5 text-green-400 mr-2" />
            Coding Streak
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">{currentStreak}</div>
            <div className="text-xs text-gray-400">Current</div>
          </div>
        </div>

        <div className="grid grid-cols-10 gap-1 mb-4">
          {calendarData.map((day, index) => (
            <div
              key={index}
              className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs transition-all hover:scale-110 cursor-pointer ${
                day.isToday
                  ? "ring-2 ring-blue-400 " + getIntensityColor(day.problemsSolved)
                  : getIntensityColor(day.problemsSolved)
              }`}
              title={`${day.fullDate}: ${day.problemsSolved} problems solved`}
            >
              {day.date}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>Longest: {longestStreak} days</span>
          <div className="flex items-center space-x-2">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-gray-700 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-800 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    )
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({
        ...prev,
        currentPage: newPage,
      }))
      window.scrollTo(0, 0)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }))
  }

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(newSortBy)
      setSortOrder("desc")
    }
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }))
  }

  const resetFilters = () => {
    setSearchQuery("")
    setDifficultyFilter("all")
    setTagFilter("all")
    setSortBy("createdAt")
    setSortOrder("desc")
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }))
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-400 bg-green-900 bg-opacity-30 border-green-500"
      case "Medium":
        return "text-yellow-400 bg-yellow-900 bg-opacity-30 border-yellow-500"
      case "Hard":
        return "text-red-400 bg-red-900 bg-opacity-30 border-red-500"
      default:
        return "text-gray-400 bg-gray-900 bg-opacity-30 border-gray-500"
    }
  }

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return <Star className="h-4 w-4" />
      case "Medium":
        return <Target className="h-4 w-4" />
      case "Hard":
        return <Trophy className="h-4 w-4" />
      default:
        return <Code className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-purple-400 mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              Practice Arena
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Sharpen your coding skills with our collection of algorithmic problems
          </p>
        </div>

        {/* User Progress Stats */}
        {currentUser && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-8 w-8" />
                <span className="text-2xl font-bold">{userStats.totalSolved}</span>
              </div>
              <div className="text-purple-200 text-sm">Total Solved</div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Star className="h-8 w-8" />
                <span className="text-2xl font-bold">{userStats.easySolved}</span>
              </div>
              <div className="text-green-200 text-sm">Easy Problems</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-8 w-8" />
                <span className="text-2xl font-bold">{userStats.mediumSolved}</span>
              </div>
              <div className="text-yellow-200 text-sm">Medium Problems</div>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-8 w-8" />
                <span className="text-2xl font-bold">{userStats.hardSolved}</span>
              </div>
              <div className="text-red-200 text-sm">Hard Problems</div>
            </div>
          </div>
        )}

        {/* Streak Calendar */}
        {currentUser && (
          <div className="mb-8">
            <StreakCalendar currentStreak={userStats.currentStreak} longestStreak={userStats.longestStreak} />
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
              </form>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <BarChart3 className="h-5 w-5" />
              <span>{pagination.totalProblems} problems available</span>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Difficulty</label>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="all">All Tags</option>
                    {availableTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split("-")
                      setSortBy(newSortBy)
                      setSortOrder(newSortOrder)
                    }}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="solvedCount-desc">Most Solved</option>
                    <option value="solvedCount-asc">Least Solved</option>
                    <option value="title-asc">Title (A-Z)</option>
                    <option value="title-desc">Title (Z-A)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Problems Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-700 rounded w-16"></div>
                  <div className="h-8 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Error Loading Problems</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : problems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {problems.map((problem) => (
                <div
                  key={problem._id}
                  className="bg-gray-800 rounded-xl shadow-lg p-6 hover:bg-gray-750 transition-all duration-200 hover:shadow-xl border border-gray-700 hover:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {problem.solved ? (
                        <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                      ) : (
                        <Clock className="h-6 w-6 text-gray-400 mr-2" />
                      )}
                      <span
                        className={`px-3 py-1 text-xs rounded-full border font-medium flex items-center ${getDifficultyColor(
                          problem.difficulty,
                        )}`}
                      >
                        {getDifficultyIcon(problem.difficulty)}
                        <span className="ml-1">{problem.difficulty}</span>
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{problem.solvedCount || 0}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-3 text-white hover:text-purple-400 transition-colors">
                    {problem.title}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{problem.description?.substring(0, 100)}...</p>

                  {problem.tags && problem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {problem.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {problem.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{problem.tags.length - 3} more</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-400">
                      <Zap className="h-4 w-4 mr-1" />
                      <span>Difficulty: {problem.difficulty}</span>
                    </div>
                    <Link
                      to={`/practice/${problem._id}`}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Solve
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-gray-800 rounded-xl p-6">
                <div className="text-sm text-gray-400">
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalProblems} problems)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  <div className="flex space-x-1">
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                      const pageNum = pagination.currentPage - 2 + index
                      if (pageNum < 1 || pageNum > pagination.totalPages) return null

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            pageNum === pagination.currentPage
                              ? "bg-purple-600 text-white"
                              : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Problems Found</h3>
            <p className="text-gray-400 mb-4">No problems found matching your criteria.</p>
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default PracticePage
