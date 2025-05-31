"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import {
  Trophy,
  Code,
  Users,
  ArrowRight,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  Target,
  Clock,
  Award,
  Zap,
  BookOpen,
  Play,
  BarChart3,
} from "lucide-react"
import api from "../utils/api"

const Dashboard = () => {
  const { currentUser } = useAuth()
  const { joinMatchmaking } = useSocket()
  const navigate = useNavigate()

  const [userStats, setUserStats] = useState(null)
  const [recentMatches, setRecentMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch user profile with stats
        const profileResponse = await api.get("/user/profile")
        setUserStats(profileResponse.data)

        // Fetch recent matches
        const matchesResponse = await api.get(`/user/${currentUser._id}/recent-matches?limit=4`)
        setRecentMatches(matchesResponse.data.matches)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (currentUser) {
      fetchUserData()
    }
  }, [currentUser])

  const handleFindMatch = () => {
    joinMatchmaking()
    navigate("/matchmaking")
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Format rating history data for chart
  const formatRatingHistory = (ratingHistory) => {
    if (!ratingHistory || !ratingHistory.length) return []

    return ratingHistory.map((item, index) => ({
      match: index + 1,
      rating: item.rating,
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }))
  }

  // Calculate win streak
  const calculateWinStreak = (matches) => {
    if (!matches || matches.length === 0) return 0

    let streak = 0
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].result === "win") {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {currentUser?.username || "Coder"}! 👋
              </h1>
              <p className="text-gray-400">Ready to sharpen your coding skills?</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">{userStats?.user?.rating || 1200}</div>
                <div className="text-sm text-gray-400">Current Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="h-8 w-8 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-8 bg-gray-700 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-20"></div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
                <Trophy className="h-8 w-8 mb-4" />
                <div className="text-2xl font-bold">{userStats?.user?.rating || 1200}</div>
                <div className="text-purple-200 text-sm">Rating</div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <Target className="h-8 w-8 mb-4" />
                <div className="text-2xl font-bold">{userStats?.stats?.matchesPlayed || 0}</div>
                <div className="text-blue-200 text-sm">Matches</div>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
                <TrendingUp className="h-8 w-8 mb-4" />
                <div className="text-2xl font-bold">{userStats?.stats?.winRate || 0}%</div>
                <div className="text-green-200 text-sm">Win Rate</div>
              </div>

              <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white">
                <Zap className="h-8 w-8 mb-4" />
                <div className="text-2xl font-bold">{calculateWinStreak(recentMatches)}</div>
                <div className="text-orange-200 text-sm">Win Streak</div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-700"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-24"></div>
                    <div className="h-4 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-700 rounded-lg p-4">
                      <div className="h-6 bg-gray-600 rounded w-12 mx-auto mb-2"></div>
                      <div className="h-3 bg-gray-600 rounded w-16 mx-auto"></div>
                    </div>
                  ))}
                </div>
                <div className="h-12 bg-gray-700 rounded-lg"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-2xl font-bold">
                    {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{currentUser?.username || "User"}</h2>
                    <div className="flex items-center mt-1">
                      <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-lg font-semibold text-purple-400">{userStats?.user?.rating || 1200}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{userStats?.stats?.matchesWon || 0}</div>
                    <div className="text-xs text-gray-400">Wins</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{userStats?.stats?.matchesLost || 0}</div>
                    <div className="text-xs text-gray-400">Losses</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center col-span-2">
                    <div className="text-2xl font-bold text-blue-400">{userStats?.stats?.matchesPlayed || 0}</div>
                    <div className="text-xs text-gray-400">Total Matches</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleFindMatch}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg font-medium transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Find Match
                  </button>

                  <Link
                    to="/practice"
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    <Code className="mr-2 h-5 w-5" />
                    Practice Mode
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Rating History Chart */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-purple-400" />
                Rating Progress
              </h3>
              <div className="text-sm text-gray-400">Last 10 matches</div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : userStats?.stats?.ratingHistory?.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={formatRatingHistory(userStats.stats.ratingHistory)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        borderColor: "#374151",
                        borderRadius: "8px",
                        border: "1px solid #374151",
                      }}
                      labelStyle={{ color: "#F9FAFB" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rating"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      fill="url(#ratingGradient)"
                      dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#8B5CF6", strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <TrendingUp className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-center">
                  No rating history available yet.
                  <br />
                  Start playing to see your progress!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Matches */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold flex items-center">
              <Clock className="mr-2 h-6 w-6 text-purple-400" />
              Recent Duels
            </h3>
            <Link
              to="/match/history"
              className="text-purple-400 hover:text-purple-300 flex items-center transition-colors"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : recentMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-gray-800 rounded-xl shadow-lg p-6 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-400">{formatDate(match.date)}</span>
                    </div>
                    <div
                      className={`text-sm font-medium flex items-center ${
                        match.result === "win" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {match.result === "win" ? (
                        <>
                          <CheckCircle className="mr-1 h-4 w-4" />+{match.ratingChange}
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-4 w-4" />
                          {match.ratingChange}
                        </>
                      )}
                    </div>
                  </div>

                  <h4 className="text-lg font-semibold mb-2">vs. {match.opponent.username}</h4>

                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <Trophy className="h-4 w-4 mr-1" />
                    <span>Rating: {match.opponent.rating}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-400 mb-4">
                    <Code className="h-4 w-4 mr-1" />
                    <span className="truncate">Problem: {match.problem.title}</span>
                  </div>

                  <Link
                    to={`/result/${match.id}`}
                    className="block text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl shadow-lg p-8 text-center">
              <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">You haven't participated in any duels yet.</p>
              <button
                onClick={handleFindMatch}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Find Your First Match
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Practice Section */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center mb-4">
              <BookOpen className="h-8 w-8 mr-3" />
              <h3 className="text-2xl font-semibold">Practice Mode</h3>
            </div>
            <p className="text-blue-100 mb-6">
              Sharpen your skills with our collection of algorithmic problems. Practice at your own pace before
              challenging others.
            </p>
            <Link
              to="/practice"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Practicing
            </Link>
          </div>

          {/* Competitive Section */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center mb-4">
              <Award className="h-8 w-8 mr-3" />
              <h3 className="text-2xl font-semibold">Competitive Duels</h3>
            </div>
            <p className="text-purple-100 mb-6">
              Challenge other coders in real-time duels. Climb the leaderboard and prove your programming prowess.
            </p>
            <button
              onClick={handleFindMatch}
              className="inline-flex items-center px-6 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors shadow-lg"
            >
              <Users className="mr-2 h-5 w-5" />
              Find Match
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Dashboard
