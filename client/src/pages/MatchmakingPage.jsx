import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSocket } from "../contexts/SocketContext"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import { Users, X, Clock } from "lucide-react"

const MatchmakingPage = () => {
  const { socket, connected, joinMatchmaking, cancelMatchmaking } = useSocket()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [searchTime, setSearchTime] = useState(0)
  const [opponent, setOpponent] = useState(null)
  const [matchFound, setMatchFound] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [matchId, setMatchId] = useState(null)
  const [error, setError] = useState(null)

  // Join matchmaking queue when component mounts
  useEffect(() => {
    if (connected) {
      joinMatchmaking()
    }
  }, [connected, joinMatchmaking])

  // Start timer for search time
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format search time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Listen for socket events
  useEffect(() => {
    if (!socket) return

    // Listen for matchmaking joined confirmation
    const handleMatchmakingJoined = () => {
      // console.log("Joined matchmaking queue")
    }

    // Listen for matchmaking error
    const handleMatchmakingError = (data) => {
      // console.error("Matchmaking error:", data.message)
      setError(data.message)
    }

    // Listen for match found event
    const handleMatchFound = (data) => {
      setOpponent(data.opponent)
      setMatchFound(true)
      setMatchId(data.matchId)

      // Start countdown to match
      const countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer)
            navigate(`/duel/${data.matchId}`)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(countdownTimer)
    }

    socket.on("matchmaking_joined", handleMatchmakingJoined)
    socket.on("matchmaking_error", handleMatchmakingError)
    socket.on("match_found", handleMatchFound)

    // Cleanup
    return () => {
      socket.off("matchmaking_joined", handleMatchmakingJoined)
      socket.off("matchmaking_error", handleMatchmakingError)
      socket.off("match_found", handleMatchFound)
    }
  }, [socket, navigate])

  const handleCancelMatchmaking = () => {
    cancelMatchmaking()
    navigate("/dashboard")
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-6">Matchmaking Error</h2>
            <p className="text-red-400 mb-8">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          {!matchFound ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6">Finding a Match</h2>

              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="h-12 w-12 text-purple-500" />
                </div>
              </div>

              <p className="text-xl mb-2">Searching for an opponent...</p>
              <p className="text-gray-400 mb-8">Time elapsed: {formatTime(searchTime)}</p>

              <button
                onClick={handleCancelMatchmaking}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-md font-medium transition-colors flex items-center mx-auto"
              >
                <X className="mr-2 h-5 w-5" />
                Cancel
              </button>

              <div className="mt-8 p-4 bg-gray-700 rounded-lg text-sm text-gray-300">
                <p>
                  Tip: While you wait, think about your approach to common algorithm problems like Two Sum, Binary
                  Search, or Depth-First Search.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6">Match Found!</h2>

              <div className="flex items-center justify-center space-x-12 mb-8">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-purple-600 flex items-center justify-center text-2xl font-bold mx-auto">
                    {currentUser?.username?.charAt(0).toUpperCase() || "Y"}
                  </div>
                  <p className="mt-2 font-medium">{currentUser?.username}</p>
                  <p className="text-sm text-gray-400">Rating: {currentUser?.rating}</p>
                </div>

                <div className="text-2xl font-bold">VS</div>

                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold mx-auto">
                    {opponent?.username?.charAt(0).toUpperCase() || "O"}
                  </div>
                  <p className="mt-2 font-medium">{opponent?.username}</p>
                  <p className="text-sm text-gray-400">Rating: {opponent?.rating}</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 rounded-full text-xl font-bold">
                  <Clock className="mr-2 h-5 w-5" />
                  Starting in {countdown}s
                </div>
              </div>

              <p className="text-gray-400">Get ready to solve the problem faster than your opponent!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MatchmakingPage
