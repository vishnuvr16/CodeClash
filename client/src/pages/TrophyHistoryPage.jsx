import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { Trophy, TrendingUp, TrendingDown, Calendar, Filter, ArrowLeft, Award, Target, Zap } from "lucide-react"
import api from "../utils/api"
import { toast } from "react-toastify"

const TrophyHistoryPage = () => {
  const { currentUser } = useAuth()
  const [trophyHistory, setTrophyHistory] = useState([])
  const [filteredHistory, setFilteredHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all") // all, earned, lost
  const [timeFilter, setTimeFilter] = useState("all") // all, week, month
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchTrophyHistory()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [trophyHistory, filter, timeFilter])

  const fetchTrophyHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get("/user/trophy-history")

      if (response.data && response.data.success) {
        setTrophyHistory(response.data.history || [])
        setStats(response.data.stats || {})
      } else {
        setTrophyHistory([])
        setStats({})
      }
    } catch (error) {
      console.error("Error fetching trophy history:", error)
      setError("Failed to load trophy history. Please try again.")
      toast.error("Failed to load trophy history")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...trophyHistory]

    // Apply action filter
    if (filter !== "all") {
      filtered = filtered.filter((entry) => entry.action === filter)
    }

    // Apply time filter
    if (timeFilter !== "all") {
      const now = new Date()
      const timeThreshold =
        timeFilter === "week"
          ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter((entry) => new Date(entry.date) >= timeThreshold)
    }

    setFilteredHistory(filtered)
  }

  const getTrophyTier = (trophies) => {
    if (trophies >= 5000) return { name: "Legend", color: "text-red-400", bgColor: "bg-red-900/20", icon: "👑" }
    if (trophies >= 3000) return { name: "Champion", color: "text-cyan-400", bgColor: "bg-cyan-900/20", icon: "🏆" }
    if (trophies >= 2000) return { name: "Master", color: "text-blue-400", bgColor: "bg-blue-900/20", icon: "🥇" }
    if (trophies >= 1000) return { name: "Expert", color: "text-green-400", bgColor: "bg-green-900/20", icon: "🥈" }
    if (trophies >= 500) return { name: "Advanced", color: "text-yellow-400", bgColor: "bg-yellow-900/20", icon: "🥉" }
    if (trophies >= 200)
      return { name: "Intermediate", color: "text-purple-400", bgColor: "bg-purple-900/20", icon: "🏅" }
    return { name: "Beginner", color: "text-gray-400", bgColor: "bg-gray-900/20", icon: "🔰" }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const currentTier = getTrophyTier(currentUser?.trophies || 0)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link to="/dashboard" className="flex items-center text-gray-400 hover:text-white transition-colors mr-4">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <Trophy className="h-8 w-8 text-yellow-400 mr-3" />
                Trophy History
              </h1>
              <p className="text-gray-400">Track your trophy gains and losses over time</p>
            </div>

            {currentUser && (
              <div className="text-right">
                <div className="flex items-center justify-end mb-2">
                  <span className="text-2xl mr-2">{currentTier.icon}</span>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{currentUser.trophies}</div>
                    <div className={`text-sm ${currentTier.color}`}>{currentTier.name}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
              <TrendingUp className="h-8 w-8 mb-4" />
              <div className="text-2xl font-bold">{stats.totalEarned || 0}</div>
              <div className="text-green-200 text-sm">Total Earned</div>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white">
              <TrendingDown className="h-8 w-8 mb-4" />
              <div className="text-2xl font-bold">{stats.totalLost || 0}</div>
              <div className="text-red-200 text-sm">Total Lost</div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <Award className="h-8 w-8 mb-4" />
              <div className="text-2xl font-bold">{(stats.totalEarned || 0) - (stats.totalLost || 0)}</div>
              <div className="text-blue-200 text-sm">Net Gain</div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
              <Zap className="h-8 w-8 mb-4" />
              <div className="text-2xl font-bold">{stats.transactionCount || 0}</div>
              <div className="text-purple-200 text-sm">Transactions</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Filters:</span>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
              >
                <option value="all">All Transactions</option>
                <option value="earned">Earned Only</option>
                <option value="lost">Lost Only</option>
              </select>

              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="week">This Week</option>
              </select>
            </div>

            <div className="text-sm text-gray-400">
              Showing {filteredHistory.length} of {trophyHistory.length} transactions
            </div>
          </div>
        </div>

        {/* Trophy History List */}
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading trophy history...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Error Loading History</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchTrophyHistory}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="divide-y divide-gray-700">
              {filteredHistory.map((entry, index) => (
                <div key={index} className="p-6 hover:bg-gray-750 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-3 rounded-full ${entry.action === "earned" ? "bg-green-900/20" : "bg-red-900/20"}`}
                      >
                        {entry.action === "earned" ? (
                          <TrendingUp className="h-6 w-6 text-green-400" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-red-400" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-white mb-1">{entry.reason}</h3>
                        <div className="flex items-center text-sm text-gray-400">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(entry.date)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${entry.action === "earned" ? "text-green-400" : "text-red-400"}`}
                      >
                        {entry.action === "earned" ? "+" : "-"}
                        {entry.amount}
                      </div>
                      <div className="text-sm text-gray-400">{entry.action === "earned" ? "Earned" : "Lost"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Trophy History</h3>
              <p className="text-gray-400 mb-6">
                {filter === "all"
                  ? "You haven't earned or lost any trophies yet."
                  : `No ${filter} trophies found for the selected time period.`}
              </p>
              <div className="space-x-4">
                <Link
                  to="/practice"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  <Target className="h-5 w-5 mr-2" />
                  Practice Problems
                </Link>
                <Link
                  to="/matchmaking"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                >
                  <Award className="h-5 w-5 mr-2" />
                  Find Duel
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Trophy Tiers Guide */}
        <div className="mt-12 bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <Award className="h-6 w-6 text-yellow-400 mr-2" />
            Trophy Tiers Guide
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {[
              { name: "Beginner", min: 0, max: 199, icon: "🔰", color: "text-gray-400" },
              { name: "Intermediate", min: 200, max: 499, icon: "🏅", color: "text-purple-400" },
              { name: "Advanced", min: 500, max: 999, icon: "🥉", color: "text-yellow-400" },
              { name: "Expert", min: 1000, max: 1999, icon: "🥈", color: "text-green-400" },
              { name: "Master", min: 2000, max: 2999, icon: "🥇", color: "text-blue-400" },
              { name: "Champion", min: 3000, max: 4999, icon: "🏆", color: "text-cyan-400" },
              { name: "Legend", min: 5000, max: "∞", icon: "👑", color: "text-red-400" },
            ].map((tier, index) => (
              <div
                key={index}
                className={`text-center p-4 rounded-lg border transition-all ${
                  currentUser?.trophies >= tier.min && (tier.max === "∞" || currentUser?.trophies <= tier.max)
                    ? "border-yellow-500 bg-yellow-900/10"
                    : "border-gray-700 bg-gray-900/20"
                }`}
              >
                <div className="text-2xl mb-2">{tier.icon}</div>
                <div className={`font-semibold ${tier.color}`}>{tier.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {tier.min} - {tier.max}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default TrophyHistoryPage
