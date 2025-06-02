"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { Trophy, TrendingUp, TrendingDown, Calendar, Award, Target, Star } from "lucide-react"
import api from "../utils/api"

const TrophyHistoryPage = () => {
  const { currentUser } = useAuth()
  const [trophyHistory, setTrophyHistory] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all") // all, earned, lost

  useEffect(() => {
    const fetchTrophyHistory = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await api.get("/user/trophy-history")
        setTrophyHistory(response.data.history)
        setUserStats(response.data.stats)
      } catch (error) {
        console.error("Error fetching trophy history:", error)
        setError("Failed to load trophy history. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (currentUser) {
      fetchTrophyHistory()
    }
  }, [currentUser])

  const filteredHistory = trophyHistory.filter((entry) => {
    if (filter === "all") return true
    return entry.action === filter
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <Trophy className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Error Loading Trophy History</h2>
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

  const currentTier = userStats ? getTrophyTier(userStats.currentTrophies) : getTrophyTier(0)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-yellow-400 mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Trophy History
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">Track your trophy gains and losses over time</p>
        </div>

        {/* Current Stats */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`${currentTier.bgColor} rounded-xl p-6 text-center border border-gray-700`}>
              <div className="text-4xl mb-2">{currentTier.icon}</div>
              <div className={`text-2xl font-bold ${currentTier.color}`}>{userStats.currentTrophies}</div>
              <div className="text-gray-400 text-sm">Current Trophies</div>
              <div className={`text-xs ${currentTier.color} mt-1`}>{currentTier.name}</div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-400">{userStats.totalEarned}</div>
              <div className="text-gray-400 text-sm">Total Earned</div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <TrendingDown className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-400">{userStats.totalLost}</div>
              <div className="text-gray-400 text-sm">Total Lost</div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <Target className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">
                {userStats.totalEarned - userStats.totalLost > 0 ? "+" : ""}
                {userStats.totalEarned - userStats.totalLost}
              </div>
              <div className="text-gray-400 text-sm">Net Gain</div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Trophy History</h3>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Transactions</option>
              <option value="earned">Trophies Earned</option>
              <option value="lost">Trophies Lost</option>
            </select>
          </div>
        </div>

        {/* Trophy History */}
        {isLoading ? (
          <div className="bg-gray-800 rounded-xl shadow-lg p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="divide-y divide-gray-700">
              {filteredHistory.map((entry, index) => (
                <div key={index} className="p-6 hover:bg-gray-750 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-3 rounded-full ${
                          entry.action === "earned" ? "bg-green-900/20" : "bg-red-900/20"
                        }`}
                      >
                        {entry.action === "earned" ? (
                          <TrendingUp className="h-6 w-6 text-green-400" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-red-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{entry.reason}</h4>
                        <div className="flex items-center text-sm text-gray-400 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(entry.date)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xl font-bold ${entry.action === "earned" ? "text-green-400" : "text-red-400"}`}
                      >
                        {entry.action === "earned" ? "+" : "-"}
                        {entry.amount}
                      </div>
                      <div className="text-sm text-gray-400">trophies</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Trophy History</h3>
            <p className="text-gray-400 mb-6">
              {filter === "all"
                ? "You haven't earned or lost any trophies yet."
                : filter === "earned"
                  ? "You haven't earned any trophies yet."
                  : "You haven't lost any trophies yet."}
            </p>
            <button
              onClick={() => (window.location.href = "/practice")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              Start Practicing
            </button>
          </div>
        )}

        {/* Trophy Tiers Info */}
        <div className="mt-12 bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <Star className="h-6 w-6 text-yellow-400 mr-2" />
            Trophy Tiers
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
                className={`text-center p-4 rounded-lg border ${
                  userStats &&
                  userStats.currentTrophies >= tier.min &&
                  userStats.currentTrophies <= (tier.max === "∞" ? Number.POSITIVE_INFINITY : tier.max)
                    ? "border-yellow-400 bg-yellow-900/10"
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
