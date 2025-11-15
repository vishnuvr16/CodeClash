import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { Trophy, Medal, Crown, Star, Search, RefreshCw, TrendingUp, Users, Award, Zap } from "lucide-react"
import api from "../utils/api"
import { toast } from "react-toastify"
import { Link } from "react-router-dom"

const LeaderboardPage = () => {
  const { currentUser } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: 50,
      })

      if (searchQuery) {
        params.append("search", searchQuery)
      }

      const response = await api.get(`/leaderboard?${params.toString()}`)

      if (response.data && response.data.success) {
        setLeaderboard(response.data.leaderboard || [])
        setUserRank(response.data.userRank)
      } else {
        setLeaderboard([])
        console.error("Invalid leaderboard response:", response.data)
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
      setError("Failed to load leaderboard. Please try again.")
      toast.error("Failed to load leaderboard")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchLeaderboard()
  }

  const refreshLeaderboard = () => {
    setSearchQuery("")
    fetchLeaderboard()
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-amber-400" />
      case 2:
        return <Medal className="h-5 w-5 text-slate-400" />
      case 3:
        return <Medal className="h-5 w-5 text-orange-400" />
      default:
        return <span className="text-sm font-semibold text-slate-500">#{rank}</span>
    }
  }

  const getTrophyTier = (trophies) => {
    if (trophies >= 5000) return { name: "Legend", color: "text-red-500", bgColor: "bg-red-50", icon: "👑" }
    if (trophies >= 3000) return { name: "Champion", color: "text-cyan-600", bgColor: "bg-cyan-50", icon: "🏆" }
    if (trophies >= 2000) return { name: "Master", color: "text-blue-600", bgColor: "bg-blue-50", icon: "🥇" }
    if (trophies >= 1000) return { name: "Expert", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: "🥈" }
    if (trophies >= 500) return { name: "Advanced", color: "text-amber-600", bgColor: "bg-amber-50", icon: "🥉" }
    if (trophies >= 200) return { name: "Intermediate", color: "text-purple-600", bgColor: "bg-purple-50", icon: "🏅" }
    return { name: "Beginner", color: "text-slate-600", bgColor: "bg-slate-50", icon: "🔰" }
  }

  // Filter leaderboard based on search query
  const filteredLeaderboard = leaderboard.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-3 rounded-full mr-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Global Leaderboard</h1>
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Compete with developers worldwide and climb the ranks
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Players</p>
                <p className="text-2xl font-bold text-white">{leaderboard.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="bg-emerald-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Active Today</p>
                <p className="text-2xl font-bold text-white">{Math.floor(leaderboard.length * 0.3)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Top Tier</p>
                <p className="text-2xl font-bold text-white">{leaderboard.filter((u) => u.trophies >= 2000).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="bg-amber-100 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Avg Trophies</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round(leaderboard.reduce((sum, u) => sum + (u.trophies || 0), 0) / leaderboard.length) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User's Current Rank Card */}
        {currentUser && userRank && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold">Your Current Position</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2" />
                      <span className="text-lg font-semibold">Rank #{userRank.rank}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 mr-2" />
                      <span className="text-lg font-semibold">{userRank.trophies} Trophies</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      <span className="text-lg font-semibold">{userRank.winRate}% Win Rate</span>
                    </div>
                  </div>
                </div>
              </div>
              <Link
                to="/trophy-history"
                className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Trophy History
              </Link>
            </div>
          </div>
        )}

        {/* Search and Controls */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <form onSubmit={handleSearch} className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex bg-gray-500 rounded-lg items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-500  rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </form>

            <button
              onClick={refreshLeaderboard}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Top 3 Podium - RESPONSIVE VERSION */}
        {!isLoading && filteredLeaderboard.length >= 3 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8 text-white">🏆 Top Performers</h2>

            {/* Mobile Podium (Cards) */}
            <div className="md:hidden space-y-4">
              {filteredLeaderboard.slice(0, 3).map((user, index) => (
                <div
                  key={user._id}
                  className={`p-4 rounded-xl shadow-md flex items-center space-x-4 ${
                    index === 0
                      ? "bg-gradient-to-br from-amber-300 to-amber-500"
                      : index === 1
                        ? "bg-gradient-to-br from-slate-200 to-slate-400"
                        : "bg-gradient-to-br from-orange-300 to-orange-500"
                  }`}
                >
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-xl font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-white flex items-center justify-center">
                      {index === 0 ? (
                        <Crown className="h-4 w-4 text-amber-500" />
                      ) : index === 1 ? (
                        <Medal className="h-4 w-4 text-slate-500" />
                      ) : (
                        <Medal className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3
                      className={`font-bold ${index === 0 ? "text-amber-900" : index === 1 ? "text-slate-800" : "text-orange-900"}`}
                    >
                      {user.username}
                    </h3>
                    <p
                      className={`font-semibold ${index === 0 ? "text-amber-800" : index === 1 ? "text-slate-700" : "text-orange-800"}`}
                    >
                      {user.trophies} 🏆
                    </p>
                    <p
                      className={`text-sm ${index === 0 ? "text-amber-800" : index === 1 ? "text-slate-700" : "text-orange-800"}`}
                    >
                      Win Rate: {user.winRate}%
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Podium */}
            <div className="hidden md:flex items-end justify-center space-x-4 lg:space-x-8">
              {/* 2nd Place */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-slate-200 to-slate-400 rounded-xl p-6 mb-4 transform hover:scale-105 transition-transform shadow-lg">
                  <div className="h-20 w-20 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-2xl font-bold mx-auto mb-4 text-slate-800">
                    {filteredLeaderboard[1]?.username.charAt(0).toUpperCase()}
                  </div>
                  <Medal className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800">{filteredLeaderboard[1]?.username}</h3>
                  <p className="text-slate-700 font-semibold">{filteredLeaderboard[1]?.trophies} 🏆</p>
                </div>
                <div className="h-24 bg-gradient-to-t from-slate-300 to-slate-400 rounded-t-lg w-full"></div>
              </div>

              {/* 1st Place */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-amber-300 to-amber-500 rounded-xl p-8 mb-4 transform hover:scale-105 transition-transform shadow-lg">
                  <div className="h-24 w-24 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-3xl font-bold mx-auto mb-4 text-amber-900">
                    {filteredLeaderboard[0]?.username.charAt(0).toUpperCase()}
                  </div>
                  <Crown className="h-10 w-10 text-amber-800 mx-auto mb-2" />
                  <h3 className="font-bold text-amber-900 text-lg">{filteredLeaderboard[0]?.username}</h3>
                  <p className="text-amber-800 font-semibold text-lg">{filteredLeaderboard[0]?.trophies} 🏆</p>
                </div>
                <div className="h-32 bg-gradient-to-t from-amber-400 to-amber-500 rounded-t-lg w-full"></div>
              </div>

              {/* 3rd Place */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-orange-300 to-orange-500 rounded-xl p-6 mb-4 transform hover:scale-105 transition-transform shadow-lg">
                  <div className="h-20 w-20 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-2xl font-bold mx-auto mb-4 text-orange-900">
                    {filteredLeaderboard[2]?.username.charAt(0).toUpperCase()}
                  </div>
                  <Medal className="h-8 w-8 text-orange-800 mx-auto mb-2" />
                  <h3 className="font-bold text-orange-900">{filteredLeaderboard[2]?.username}</h3>
                  <p className="text-orange-800 font-semibold">{filteredLeaderboard[2]?.trophies} 🏆</p>
                </div>
                <div className="h-20 bg-gradient-to-t from-orange-400 to-orange-500 rounded-t-lg w-full"></div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading leaderboard...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <Trophy className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">Error Loading Leaderboard</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredLeaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Trophies
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Matches
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Win Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {filteredLeaderboard.map((user, index) => {
                    const rank = index + 1
                    const trophyTier = getTrophyTier(user.trophies || 0)
                    const isCurrentUser = currentUser && user._id === currentUser._id

                    return (
                      <tr
                        key={user._id}
                        className={`hover:bg-gray-800 transition-colors ${
                          isCurrentUser ? "bg-gray-800-50 border-l-4 border-indigo-500" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center w-8 h-8">{getRankIcon(rank)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white mr-4">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <span
                                  className={`text-lg font-medium ${isCurrentUser ? "text-indigo-900" : "text-white"}`}
                                >
                                  {user.username}
                                </span>
                                {isCurrentUser && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <div
                                className={`text-xs px-2 py-1 rounded-full ${trophyTier.bgColor} ${trophyTier.color} inline-block mt-1`}
                              >
                                {trophyTier.icon} {trophyTier.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Trophy className="h-5 w-5 text-amber-500 mr-2" />
                            <span className="text-2xl font-bold text-amber-600">{user.trophies || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-medium text-white">{user.matchesPlayed || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-lg font-semibold text-white">{user.winRate || 0}%</div>
                            <div className="ml-3 w-20 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${user.winRate || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Trophy className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">No Players Found</h3>
              <p className="text-gray-300">No players match your search criteria.</p>
            </div>
          )}
        </div>

        {/* Trophy Tiers Info */}
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

export default LeaderboardPage
