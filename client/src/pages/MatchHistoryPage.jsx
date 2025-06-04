"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { Clock, CheckCircle, XCircle, Trophy, Flag, AlertTriangle } from "lucide-react"
import api from "../utils/api"

const MatchHistoryPage = () => {
  const { currentUser } = useAuth()

  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all") // all, wins, losses
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalMatches: 0,
  })

  useEffect(() => {
    const fetchMatchHistory = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Build query parameters
        const queryParams = new URLSearchParams({
          page: pagination.currentPage,
          limit: 10,
        })

        if (filter !== "all") {
          queryParams.append("result", filter)
        }

        const response = await api.get(`/match/user/history?${queryParams.toString()}`)

        if (response.data && response.data.matches) {
          setMatches(response.data.matches)
          setPagination({
            currentPage: Number.parseInt(response.data.currentPage) || 1,
            totalPages: Number.parseInt(response.data.totalPages) || 1,
            totalMatches: Number.parseInt(response.data.totalMatches) || 0,
          })
        } else {
          console.error("Invalid match history response:", response.data)
          setError("Invalid response format from server")
        }
      } catch (error) {
        console.error("Error fetching match history:", error)
        setError("Failed to load match history. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (currentUser) {
      fetchMatchHistory()
    }
  }, [currentUser, pagination.currentPage, filter])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({
        ...prev,
        currentPage: newPage,
      }))
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  const getResultDetails = (match) => {
    const isUserA = currentUser && match.userA && match.userA._id === currentUser._id
    const isWinner = match.winner && match.winner._id === (currentUser ? currentUser._id : null)
    const wasConceded = match.concedeBy && match.concedeBy._id
    const userConceded = match.concedeBy && match.concedeBy._id === (currentUser ? currentUser._id : null)

    if (wasConceded) {
      if (userConceded) {
        return {
          result: "loss",
          icon: <Flag className="h-5 w-5 mr-1" />,
          label: "Conceded",
          color: "text-orange-500",
        }
      } else {
        return {
          result: "win",
          icon: <Flag className="h-5 w-5 mr-1" />,
          label: "Opponent Conceded",
          color: "text-green-500",
        }
      }
    } else if (isWinner) {
      return {
        result: "win",
        icon: <CheckCircle className="h-5 w-5 mr-1" />,
        label: "Win",
        color: "text-green-500",
      }
    } else if (match.winner) {
      return {
        result: "loss",
        icon: <XCircle className="h-5 w-5 mr-1" />,
        label: "Loss",
        color: "text-red-500",
      }
    } else {
      return {
        result: "draw",
        icon: <AlertTriangle className="h-5 w-5 mr-1" />,
        label: "Draw",
        color: "text-yellow-500",
      }
    }
  }

  const getRatingChange = (match) => {
    const isUserA = currentUser && match.userA && match.userA._id === currentUser._id
    return isUserA ? match.ratingChangeA : match.ratingChangeB
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Clock className="h-8 w-8 text-purple-400 mr-2" />
              Match History
            </h1>
            <p className="text-gray-400 mt-2">View your past duels and performance</p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Matches</option>
                <option value="wins">Wins Only</option>
                <option value="losses">Losses Only</option>
              </select>
            </div>

            <Link
              to="/trophy-history"
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
            >
              <Trophy className="h-5 w-5 mr-2" />
              Trophy History
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Error Loading Match History</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : matches.length > 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Opponent
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Problem
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Result
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Rating Change
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {matches.map((match) => {
                    const resultDetails = getResultDetails(match)
                    const ratingChange = getRatingChange(match)

                    return (
                      <tr key={match._id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{formatDate(match.createdAt || match.date)}</div>
                          <div className="text-xs text-gray-400">{formatTime(match.createdAt || match.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                              {match.opponent?.username?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium">{match.opponent?.username || "Unknown"}</div>
                              <div className="text-xs text-gray-400">Rating: {match.opponent?.rating || "N/A"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{match.problem?.title || "Unknown Problem"}</div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              match.problem?.difficulty === "Easy"
                                ? "bg-green-900 bg-opacity-20 text-green-500"
                                : match.problem?.difficulty === "Medium"
                                  ? "bg-yellow-900 bg-opacity-20 text-yellow-500"
                                  : "bg-red-900 bg-opacity-20 text-red-500"
                            }`}
                          >
                            {match.problem?.difficulty || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center ${resultDetails.color}`}>
                            {resultDetails.icon}
                            {resultDetails.label}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium ${ratingChange >= 0 ? "text-green-500" : "text-red-500"}`}
                          >
                            {ratingChange >= 0 ? `+${ratingChange}` : ratingChange}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/result/${match._id}`} className="text-purple-400 hover:text-purple-300">
                            View Details
                          </Link>
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
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No match history found.</p>
            <Link
              to="/matchmaking"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors inline-block"
            >
              Find Your First Match
            </Link>
          </div>
        )}

        {/* Stats Section */}
        {matches.length > 0 && (
          <div className="mt-12 bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Match Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-700 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold">{pagination.totalMatches}</div>
                <div className="text-sm text-gray-400">Total Matches</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-500">
                  {matches.filter((m) => getResultDetails(m).result === "win").length}
                </div>
                <div className="text-sm text-gray-400">Wins</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-red-500">
                  {matches.filter((m) => getResultDetails(m).result === "loss").length}
                </div>
                <div className="text-sm text-gray-400">Losses</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {matches.length > 0
                    ? Math.round(
                        (matches.filter((m) => getResultDetails(m).result === "win").length / matches.length) * 100,
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-400">Win Rate</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default MatchHistoryPage
