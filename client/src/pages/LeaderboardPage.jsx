"use client"

import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { Trophy, Search, ChevronUp, ChevronDown, Users, AlertCircle } from "lucide-react"
import api from "../utils/api"

const LeaderboardPage = () => {
  const { currentUser } = useAuth()

  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeframe, setTimeframe] = useState("all-time")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "rating", direction: "desc" })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  })

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await api.get(`/leaderboard?page=${pagination.currentPage}&timeframe=${timeframe}`)
        setLeaderboard(response.data.users)
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalUsers: response.data.totalUsers,
        })
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
        setError("Failed to load leaderboard data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [timeframe, pagination.currentPage])

  // Sort leaderboard
  const sortedLeaderboard = React.useMemo(() => {
    let sortableItems = [...leaderboard]

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1
        }
        return 0
      })
    }

    // Filter by search query
    if (searchQuery) {
      sortableItems = sortableItems.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    return sortableItems
  }, [leaderboard, sortConfig, searchQuery])

  const requestSort = (key) => {
    let direction = "desc"
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc"
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null
    }
    return sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({
        ...prev,
        currentPage: newPage,
      }))
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Error Loading Leaderboard</h2>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Trophy className="h-8 w-8 text-yellow-400 mr-2" />
              Leaderboard
            </h1>
            <p className="text-gray-400 mt-2">Top coders ranked by their performance in duels</p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all-time">All Time</option>
              <option value="monthly">This Month</option>
              <option value="weekly">This Week</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Rank
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("rating")}
                    >
                      <div className="flex items-center">
                        Rating
                        {getSortIcon("rating")}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("totalMatches")}
                    >
                      <div className="flex items-center">
                        Matches
                        {getSortIcon("totalMatches")}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort("winRate")}
                    >
                      <div className="flex items-center">
                        Win Rate
                        {getSortIcon("winRate")}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {sortedLeaderboard.map((user, index) => {
                    const isCurrentUser = currentUser && user.id === currentUser._id
                    const rank = (pagination.currentPage - 1) * 10 + index + 1

                    return (
                      <tr
                        key={user.id}
                        className={`${isCurrentUser ? "bg-purple-900 bg-opacity-20" : "hover:bg-gray-700"}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`text-lg font-bold ${
                                rank === 1
                                  ? "text-yellow-400"
                                  : rank === 2
                                    ? "text-gray-300"
                                    : rank === 3
                                      ? "text-amber-600"
                                      : "text-gray-400"
                              }`}
                            >
                              {rank}
                            </span>
                            {rank <= 3 && (
                              <Trophy
                                className={`ml-1 h-4 w-4 ${
                                  rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : "text-amber-600"
                                }`}
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-lg font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium">
                                {user.username}
                                {isCurrentUser && (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-purple-600 rounded-full">You</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{user.rating}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{user.totalMatches}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{user.winRate}%</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 bg-gray-700 rounded-md text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 bg-gray-700 rounded-md text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-purple-800 to-blue-800 rounded-lg shadow-lg p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">Ready to climb the ranks?</h2>
              <p className="text-gray-300 max-w-2xl">
                Challenge other coders in real-time duels and improve your algorithmic problem-solving skills.
              </p>
            </div>
            <Link
              to="/matchmaking"
              className="px-6 py-3 bg-white text-gray-900 hover:bg-gray-100 rounded-md font-medium transition-colors flex items-center justify-center"
            >
              <Users className="mr-2 h-5 w-5" />
              Find a Match
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default LeaderboardPage
