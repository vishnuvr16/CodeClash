"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { Trophy, Medal, Crown, TrendingUp, TrendingDown, Users, Target, Award, Star, ChevronUp, ChevronDown, Filter, Search, Calendar, BarChart3 } from 'lucide-react'
import api from "../utils/api"
import { toast } from "react-toastify"

const LeaderboardPage = () => {
  const { currentUser } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeFilter, setTimeFilter] = useState("all") // all, week, month
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("rating") // rating, winRate, matches
  const [sortOrder, setSortOrder] = useState("desc")

  useEffect(() => {
    fetchLeaderboard()
  }, [timeFilter, sortBy, sortOrder])

  const fetchLeaderboard = async () => {
  try {
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams({
      timeFilter,
      sortBy,
      order: sortOrder,
      limit: 50,
    })

    if (searchQuery) {
      params.append("search", searchQuery)
    }

    const response = await api.get(`/leaderboard?${params.toString()}`)
    
    // Add safety checks here
    setLeaderboard(response.data.leaderboard || [])
    setUserRank(response.data.userRank)
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    setError("Failed to load leaderboard. Please try again.")
    setLeaderboard([]) // Ensure it's always an array
    toast.error("Failed to load leaderboard")
  } finally {
    setIsLoading(false)
  }
}

  const handleSearch = (e) => {
    e.preventDefault()
    fetchLeaderboard()
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-400" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>
    }
  }

  const getRankBadge = (rank) => {
    if (rank <= 3) {
      const colors = {
        1: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900",
        2: "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900",
        3: "bg-gradient-to-r from-amber-400 to-amber-600 text-amber-900",
      }
      return colors[rank]
    }
    return "bg-gray-700 text-gray-300"
  }

  const getRatingColor = (rating) => {
    if (rating >= 2000) return "text-red-400"
    if (rating >= 1600) return "text-purple-400"
    if (rating >= 1400) return "text-blue-400"
    if (rating >= 1200) return "text-green-400"
    return "text-gray-400"
  }

  const getRatingBadge = (rating) => {
    if (rating >= 2000) return { label: "Grandmaster", color: "bg-red-600" }
    if (rating >= 1600) return { label: "Master", color: "bg-purple-600" }
    if (rating >= 1400) return { label: "Expert", color: "bg-blue-600" }
    if (rating >= 1200) return { label: "Specialist", color: "bg-green-600" }
    return { label: "Newbie", color: "bg-gray-600" }
  }

  const filteredLeaderboard = (leaderboard || []).filter((user) =>
  user.username.toLowerCase().includes(searchQuery.toLowerCase()),
)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-yellow-400 mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Leaderboard
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Compete with the best coders and climb your way to the top
          </p>
        </div>

        {/* User's Current Rank Card */}
        {currentUser && userRank && (
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Your Current Rank</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                      <span className="text-lg font-semibold">#{userRank.rank}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-purple-200 mr-2" />
                      <span className="text-lg font-semibold">{userRank.rating} Rating</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{userRank.winRate}%</div>
                <div className="text-purple-200">Win Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
              </form>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="week">This Week</option>
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Sort By</label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-")
                      setSortBy(field)
                      setSortOrder(order)
                    }}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="rating-desc">Rating (High to Low)</option>
                    <option value="rating-asc">Rating (Low to High)</option>
                    <option value="winRate-desc">Win Rate (High to Low)</option>
                    <option value="winRate-asc">Win Rate (Low to High)</option>
                    <option value="matches-desc">Matches (Most to Least)</option>
                    <option value="matches-asc">Matches (Least to Most)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top 3 Podium */}
        {!isLoading && filteredLeaderboard.length >= 3 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center">
              <Award className="h-6 w-6 text-yellow-400 mr-2" />
              Top Performers
            </h2>
            <div className="flex items-end justify-center space-x-8">
              {/* 2nd Place */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-xl p-6 mb-4 transform hover:scale-105 transition-transform">
                  <div className="h-20 w-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {filteredLeaderboard[1]?.username.charAt(0).toUpperCase()}
                  </div>
                  <Medal className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="font-bold text-gray-900">{filteredLeaderboard[1]?.username}</h3>
                  <p className="text-gray-700 font-semibold">{filteredLeaderboard[1]?.rating}</p>
                </div>
                <div className="h-24 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg"></div>
              </div>

              {/* 1st Place */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-8 mb-4 transform hover:scale-105 transition-transform">
                  <div className="h-24 w-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                    {filteredLeaderboard[0]?.username.charAt(0).toUpperCase()}
                  </div>
                  <Crown className="h-10 w-10 text-yellow-900 mx-auto mb-2" />
                  <h3 className="font-bold text-yellow-900 text-lg">{filteredLeaderboard[0]?.username}</h3>
                  <p className="text-yellow-800 font-semibold text-lg">{filteredLeaderboard[0]?.rating}</p>
                </div>
                <div className="h-32 bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg"></div>
              </div>

              {/* 3rd Place */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl p-6 mb-4 transform hover:scale-105 transition-transform">
                  <div className="h-20 w-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {filteredLeaderboard[2]?.username.charAt(0).toUpperCase()}
                  </div>
                  <Medal className="h-8 w-8 text-amber-900 mx-auto mb-2" />
                  <h3 className="font-bold text-amber-900">{filteredLeaderboard[2]?.username}</h3>
                  <p className="text-amber-800 font-semibold">{filteredLeaderboard[2]?.rating}</p>
                </div>
                <div className="h-20 bg-gradient-to-t from-amber-400 to-amber-500 rounded-t-lg"></div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading leaderboard...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Error Loading Leaderboard</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredLeaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Player
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("rating")}
                    >
                      <div className="flex items-center">
                        Rating
                        {sortBy === "rating" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("matches")}
                    >
                      <div className="flex items-center">
                        Matches
                        {sortBy === "matches" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("winRate")}
                    >
                      <div className="flex items-center">
                        Win Rate
                        {sortBy === "winRate" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredLeaderboard.map((user, index) => {
                    const rank = index + 1
                    const ratingBadge = getRatingBadge(user.rating)
                    const isCurrentUser = currentUser && user._id === currentUser._id

                    return (
                      <tr
                        key={user._id}
                        className={`hover:bg-gray-700 transition-colors ${
                          isCurrentUser ? "bg-purple-900 bg-opacity-30" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getRankBadge(rank)}`}>
                            {rank <= 3 ? getRankIcon(rank) : <span className="font-bold">#{rank}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-lg font-bold mr-4">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <span className={`text-lg font-medium ${isCurrentUser ? "text-purple-300" : "text-white"}`}>
                                  {user.username}
                                </span>
                                {isCurrentUser && <span className="ml-2 text-xs text-purple-400">(You)</span>}
                              </div>
                              <div className={`text-xs px-2 py-1 rounded-full ${ratingBadge.color} inline-block mt-1`}>
                                {ratingBadge.label}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-2xl font-bold ${getRatingColor(user.rating)}`}>{user.rating}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Target className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-lg">{user.matchesPlayed || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-lg font-semibold">{user.winRate || 0}%</div>
                            <div className="ml-2 w-20 bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${user.winRate || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.ratingChange > 0 ? (
                              <>
                                <TrendingUp className="h-5 w-5 text-green-400 mr-1" />
                                <span className="text-green-400 font-medium">+{user.ratingChange}</span>
                              </>
                            ) : user.ratingChange < 0 ? (
                              <>
                                <TrendingDown className="h-5 w-5 text-red-400 mr-1" />
                                <span className="text-red-400 font-medium">{user.ratingChange}</span>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
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
              <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Players Found</h3>
              <p className="text-gray-400">No players match your search criteria.</p>
            </div>
          )}
        </div>

        {/* Statistics Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <BarChart3 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <div className="text-3xl font-bold text-white mb-2">{filteredLeaderboard.length}</div>
            <div className="text-gray-400">Active Players</div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <div className="text-3xl font-bold text-white mb-2">
              {filteredLeaderboard.length > 0 ? filteredLeaderboard[0].rating : 0}
            </div>
            <div className="text-gray-400">Highest Rating</div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <Target className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <div className="text-3xl font-bold text-white mb-2">
              {filteredLeaderboard.length > 0
                ? Math.round(
                    filteredLeaderboard.reduce((sum, user) => sum + (user.winRate || 0), 0) / filteredLeaderboard.length,
                  )
                : 0}
              %
            </div>
            <div className="text-gray-400">Average Win Rate</div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default LeaderboardPage
