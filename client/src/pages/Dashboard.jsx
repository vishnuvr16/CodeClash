import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Trophy, Code, Users, ArrowRight, Calendar, CheckCircle, XCircle } from "lucide-react"
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

    return ratingHistory.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short" }),
      rating: item.rating,
    }))
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
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
                <div className="h-10 bg-gray-700 rounded-md"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-purple-600 flex items-center justify-center text-2xl font-bold">
                    {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{currentUser?.username || "User"}</h2>
                    <div className="flex items-center mt-1">
                      <Trophy className="h-5 w-5 text-yellow-500 mr-1" />
                      <span className="text-lg font-semibold">{userStats?.user?.rating || 0} Rating</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold">{userStats?.stats?.totalMatches || 0}</div>
                    <div className="text-sm text-gray-400">Total Duels</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold">{userStats?.stats?.winRate || 0}%</div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-500">{userStats?.stats?.wins || 0}</div>
                    <div className="text-sm text-gray-400">Wins</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-500">{userStats?.stats?.losses || 0}</div>
                    <div className="text-sm text-gray-400">Losses</div>
                  </div>
                </div>

                <button
                  onClick={handleFindMatch}
                  className="w-full mt-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Find Match
                </button>
              </>
            )}
          </div>

          {/* Rating History Chart */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 lg:col-span-2">
            <h3 className="text-xl font-semibold mb-4">Rating History</h3>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : userStats?.stats?.ratingHistory?.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatRatingHistory(userStats.stats.ratingHistory)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151" }}
                      labelStyle={{ color: "#F9FAFB" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#8B5CF6", strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p>No rating history available yet. Start playing to see your progress!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Matches */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold">Recent Duels</h3>
            <Link to="/match/history" className="text-purple-400 hover:text-purple-300 flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse">
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
                <div key={match.id} className="bg-gray-800 rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-400">{formatDate(match.date)}</span>
                    </div>
                    <div
                      className={`text-sm font-medium ${match.result === "win" ? "text-green-500" : "text-red-500"}`}
                    >
                      {match.result === "win" ? (
                        <div className="flex items-center">
                          <span>+{match.ratingChange}</span>
                          <CheckCircle className="ml-1 h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span>{match.ratingChange}</span>
                          <XCircle className="ml-1 h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  <h4 className="text-lg font-semibold mb-2">vs. {match.opponent.username}</h4>

                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <Trophy className="h-4 w-4 mr-1" />
                    <span>Rating: {match.opponent.rating}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <Code className="h-4 w-4 mr-1" />
                    <span>Problem: {match.problem.title}</span>
                  </div>

                  <Link
                    to={`/result/${match.id}`}
                    className="mt-4 block text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-400 mb-4">You haven't participated in any duels yet.</p>
              <button
                onClick={handleFindMatch}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors"
              >
                Find Your First Match
              </button>
            </div>
          )}
        </div>

        {/* Practice Section */}
        <div className="mt-12 bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-semibold mb-2">Practice Makes Perfect</h3>
              <p className="text-gray-400 max-w-2xl">
                Sharpen your skills with our collection of algorithmic problems. Practice at your own pace before
                challenging others.
              </p>
            </div>
            <Link
              to="/practice"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors flex items-center justify-center whitespace-nowrap"
            >
              <Code className="mr-2 h-5 w-5" />
              Practice Problems
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Dashboard
