"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { Trophy, Target, Award, Zap, BookOpen, Users, Clock, CheckCircle, XCircle, Flag, BarChart3 } from "lucide-react"
import api from "../utils/api"

const Dashboard = () => {
  const { currentUser } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await api.get("/users/dashboard")
        if (response.data && response.data.success) {
          setDashboardData(response.data)
        } else {
          setError("Failed to load dashboard data")
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (currentUser) {
      fetchDashboardData()
    }
  }, [currentUser])

  const getResultIcon = (result, concedeBy) => {
    if (concedeBy) {
      return <Flag className="h-4 w-4 text-orange-500" />
    }
    switch (result) {
      case "win":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "loss":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getResultText = (result, concedeBy, currentUserId) => {
    if (concedeBy) {
      return concedeBy === currentUserId ? "Conceded" : "Opponent Conceded"
    }
    return result === "win" ? "Won" : result === "loss" ? "Lost" : "Draw"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Error Loading Dashboard</h2>
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

  const { user, stats, recentMatches, ratingHistory } = dashboardData

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.username}! 👋</h1>
          <p className="text-gray-400">Ready to challenge yourself today?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Current Rating</p>
                <p className="text-2xl font-bold text-purple-400">{stats.trophies}</p>
              </div>
              <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Win Rate</p>
                <p className="text-2xl font-bold text-green-400">{stats.winRate}%</p>
              </div>
              <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Win Streak</p>
                <p className="text-2xl font-bold text-orange-400">{stats.currentWinStreak}</p>
              </div>
              <div className="h-12 w-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Problems Solved</p>
                <p className="text-2xl font-bold text-blue-400">{stats.totalProblemsSolved}</p>
              </div>
              <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Matches */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <Clock className="h-6 w-6 text-purple-400 mr-2" />
                  Recent Matches
                </h2>
                <Link
                  to="/match/history"
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center"
                >
                  View All
                  <BarChart3 className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {recentMatches && recentMatches.length > 0 ? (
                <div className="space-y-4">
                  {recentMatches.map((match) => (
                    <div key={match._id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">{getResultIcon(match.result, match.concedeBy)}</div>
                        <div>
                          <p className="font-medium">{match.problem.title}</p>
                          <p className="text-sm text-gray-400">vs {match.opponent.username}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{getResultText(match.result, match.concedeBy, user._id)}</p>
                        <p className="text-xs text-gray-400">{new Date(match.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Recent Matches</h3>
                  <p className="text-gray-400 mb-4">Start your coding journey by finding your first duel!</p>
                  <Link
                    to="/matchmaking"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                  >
                    <Trophy className="h-5 w-5 mr-2" />
                    Find Match
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Zap className="h-6 w-6 text-yellow-400 mr-2" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  to="/matchmaking"
                  className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                >
                  <Trophy className="h-5 w-5 mr-2" />
                  Find Duel
                </Link>
                <Link
                  to="/practice"
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Practice
                </Link>
                <Link
                  to="/leaderboard"
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  <Award className="h-5 w-5 mr-2" />
                  Leaderboard
                </Link>
                <Link
                  to="/trophy-history"
                  className="w-full flex items-center justify-center px-4 py-3 bg-amber-600 hover:bg-amber-700 rounded-md transition-colors"
                >
                  <Trophy className="h-5 w-5 mr-2" />
                  Trophy History
                </Link>
              </div>
            </div>

            {/* Practice Stats */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <BookOpen className="h-6 w-6 text-blue-400 mr-2" />
                Practice Progress
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Easy Problems</span>
                    <span>{stats.easyProblemsSolved}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((stats.easyProblemsSolved / 50) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Medium Problems</span>
                    <span>{stats.mediumProblemsSolved}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((stats.mediumProblemsSolved / 30) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hard Problems</span>
                    <span>{stats.hardProblemsSolved}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((stats.hardProblemsSolved / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Current Streak</span>
                    <span className="font-medium">{stats.currentStreak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Longest Streak</span>
                    <span className="font-medium">{stats.longestStreak}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Match Stats */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <BarChart3 className="h-6 w-6 text-green-400 mr-2" />
                Match Statistics
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Matches</span>
                  <span className="font-medium">{stats.totalMatches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wins</span>
                  <span className="font-medium text-green-400">{stats.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Losses</span>
                  <span className="font-medium text-red-400">{stats.losses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="font-medium text-purple-400">{stats.winRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Dashboard
