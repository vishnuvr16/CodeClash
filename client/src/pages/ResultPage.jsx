import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { Trophy, Clock, Code, CheckCircle, XCircle, Home, RotateCw, AlertCircle } from "lucide-react"
import api from "../utils/api"

const ResultPage = () => {
  const { matchId } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [match, setMatch] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMatchResult = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await api.get(`/match/${matchId}`)
        setMatch(response.data)
      } catch (error) {
        console.error("Error fetching match result:", error)
        setError("Failed to load match result. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (matchId) {
      fetchMatchResult()
    }
  }, [matchId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Match Not Found</h2>
          <p className="text-gray-400 mb-6">The match you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors inline-block"
          >
            Return to Dashboard
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  // Determine if current user is the winner
  const isUserA = currentUser._id === match.userA._id.toString()
  const isWinner = match.winner && match.winner._id === currentUser._id

  // Get user and opponent info
  const user = isUserA ? match.userA : match.userB
  const opponent = isUserA ? match.userB : match.userA
  const userRatingChange = isUserA ? match.ratingChangeA : match.ratingChangeB
  const opponentRatingChange = isUserA ? match.ratingChangeB : match.ratingChangeA

  // Get user and opponent submissions
  const userSubmission = match.submissions.find((sub) => sub.user === currentUser._id)
  const opponentSubmission = match.submissions.find((sub) => sub.user !== currentUser._id)

  // Calculate time taken
  const formatTimeTaken = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const userTimeTaken = userSubmission ? formatTimeTaken(userSubmission.timeTaken) : "N/A"
  const opponentTimeTaken = opponentSubmission ? formatTimeTaken(opponentSubmission.timeTaken) : "N/A"

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Result Header */}
          <div
            className={`p-8 ${isWinner ? "bg-gradient-to-r from-purple-900 to-blue-900" : "bg-gradient-to-r from-gray-800 to-gray-700"}`}
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">{isWinner ? "Victory!" : "Defeat"}</h2>

              <div className="inline-flex items-center justify-center mb-6">
                {isWinner ? (
                  <Trophy className="h-16 w-16 text-yellow-400" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-400" />
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-purple-600 flex items-center justify-center text-2xl font-bold mx-auto">
                    {user?.username?.charAt(0).toUpperCase() || "Y"}
                  </div>
                  <p className="mt-2 font-medium">{user?.username || "You"}</p>
                  <div className="flex items-center justify-center mt-1">
                    <span className="font-medium">{user.rating - userRatingChange}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{user.rating}</span>
                    <span className={userRatingChange >= 0 ? "text-green-400 ml-2" : "text-red-400 ml-2"}>
                      {userRatingChange >= 0 ? `+${userRatingChange}` : userRatingChange}
                    </span>
                  </div>
                </div>

                <div className="text-2xl font-bold">VS</div>

                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold mx-auto">
                    {opponent?.username?.charAt(0).toUpperCase()}
                  </div>
                  <p className="mt-2 font-medium">{opponent?.username}</p>
                  <div className="flex items-center justify-center mt-1">
                    <span className="font-medium">{opponent.rating - opponentRatingChange}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{opponent.rating}</span>
                    <span className={opponentRatingChange >= 0 ? "text-green-400 ml-2" : "text-red-400 ml-2"}>
                      {opponentRatingChange >= 0 ? `+${opponentRatingChange}` : opponentRatingChange}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Match Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  Problem
                </h3>
                <p className="text-xl font-medium mb-2">{match.problem.title}</p>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    match.problem.difficulty === "Easy"
                      ? "bg-green-900 text-green-300"
                      : match.problem.difficulty === "Medium"
                        ? "bg-yellow-900 text-yellow-300"
                        : "bg-red-900 text-red-300"
                  }`}
                >
                  {match.problem.difficulty}
                </span>
              </div>

              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Time Taken
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">You</p>
                    <p className="text-xl font-mono">{userTimeTaken}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Opponent</p>
                    <p className="text-xl font-mono">{opponentTimeTaken}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Rating Change
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">You</p>
                    <p className={`text-xl font-medium ${userRatingChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {userRatingChange >= 0 ? `+${userRatingChange}` : userRatingChange}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Opponent</p>
                    <p
                      className={`text-xl font-medium ${opponentRatingChange >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {opponentRatingChange >= 0 ? `+${opponentRatingChange}` : opponentRatingChange}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Comparison */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Solution Comparison</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Your Solution</h4>
                    {isWinner ? (
                      <div className="flex items-center text-green-400">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Faster
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <Clock className="h-4 w-4 mr-1" />
                        Slower
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre>{userSubmission?.code || "No submission"}</pre>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Opponent's Solution</h4>
                    {!isWinner ? (
                      <div className="flex items-center text-green-400">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Faster
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <Clock className="h-4 w-4 mr-1" />
                        Slower
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre>{opponentSubmission?.code || "No submission"}</pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-md font-medium transition-colors flex items-center"
              >
                <Home className="mr-2 h-5 w-5" />
                Back to Dashboard
              </Link>

              <Link
                to="/matchmaking"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors flex items-center"
              >
                <RotateCw className="mr-2 h-5 w-5" />
                Play Again
              </Link>

              <Link
                to="/leaderboard"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors flex items-center"
              >
                <Trophy className="mr-2 h-5 w-5" />
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default ResultPage
