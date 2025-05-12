"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSocket } from "../contexts/SocketContext"
import { useAuth } from "../contexts/AuthContext"
import Editor from "@monaco-editor/react"
import { Play, Send, Clock, ChevronRight, MessageSquare, AlertCircle, Flag } from "lucide-react"
import api from "../utils/api"
import { toast } from "react-toastify"

const DuelPage = () => {
  const { matchId } = useParams()
  const { socket, connected, joinMatch, sendCodeUpdate, sendProgressUpdate, sendChatMessage } = useSocket()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [match, setMatch] = useState(null)
  const [problem, setProblem] = useState(null)
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [opponent, setOpponent] = useState(null)
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [runOutput, setRunOutput] = useState("")
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConceding, setIsConceding] = useState(false)
  const [showConcedeConfirm, setShowConcedeConfirm] = useState(false)
  const [opponentProgress, setOpponentProgress] = useState(0)
  const [opponentCode, setOpponentCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editorHeight, setEditorHeight] = useState("70vh")

  const editorRef = useRef(null)
  const chatContainerRef = useRef(null)
  const progressUpdateTimerRef = useRef(null)
  const timerIntervalRef = useRef(null)

  // Calculate editor height based on window size
  useEffect(() => {
    const calculateEditorHeight = () => {
      // Calculate available height (viewport height minus headers and other elements)
      const viewportHeight = window.innerHeight
      const headerHeight = 56 // Approximate header height
      const toolbarHeight = 48 // Approximate toolbar height
      const outputHeight = runOutput ? 200 : 0 // Height of output area if visible

      // Calculate editor height (with a minimum of 300px)
      const calculatedHeight = Math.max(300, viewportHeight - headerHeight - toolbarHeight - outputHeight)
      setEditorHeight(`${calculatedHeight}px`)
    }

    // Calculate initially and on window resize
    calculateEditorHeight()
    window.addEventListener("resize", calculateEditorHeight)

    return () => window.removeEventListener("resize", calculateEditorHeight)
  }, [runOutput])

  // Fetch match data
  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get(`/match/${matchId}`)
        const matchData = response.data

        setMatch(matchData)
        setProblem(matchData.problem)

        // Set initial code from starter code or from previous submission
        const userSubmission = matchData.submissions?.find(
          (sub) => sub.user === currentUser._id && sub.language === language,
        )

        if (userSubmission) {
          setCode(userSubmission.code)
        } else if (matchData.problem.starterCode && matchData.problem.starterCode[language]) {
          setCode(matchData.problem.starterCode[language])
        }

        // Determine opponent
        const isUserA = matchData.userA._id === currentUser._id
        setOpponent(isUserA ? matchData.userB : matchData.userA)

        // Set time left based on match start time and problem time limit
        if (matchData.startTime) {
          const startTime = new Date(matchData.startTime)
          const timeLimit = matchData.problem.timeLimit || 1800 // 30 minutes default
          const elapsedSeconds = Math.floor((new Date() - startTime) / 1000)
          const remainingTime = Math.max(0, timeLimit - elapsedSeconds)
          setTimeLeft(remainingTime)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching match data:", error)
        setError("Failed to load match data. Please try again.")
        setLoading(false)
      }
    }

    if (matchId && currentUser) {
      fetchMatchData()
    }

    // Clear timer interval on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [matchId, currentUser, language])

  // Join match room via socket
  useEffect(() => {
    if (connected && matchId) {
      joinMatch(matchId)
    }
  }, [connected, matchId, joinMatch])

  // Listen for socket events
  useEffect(() => {
    if (!socket) return

    // Listen for match started event
    const handleMatchStarted = (data) => {
      console.log("Match started:", data)
      // Update match data if needed
    }

    // Listen for opponent code updates
    const handleOpponentCodeUpdate = (data) => {
      setOpponentCode(data.code)
    }

    // Listen for opponent progress updates
    const handleOpponentProgress = (data) => {
      if (data.userId !== currentUser._id) {
        setOpponentProgress(data.progress)
      }
    }

    // Listen for new chat messages
    const handleNewMessage = (data) => {
      setChatMessages((prev) => [...prev, data])
    }

    // Listen for opponent disconnection
    const handleOpponentDisconnected = () => {
      toast.warning("Your opponent has disconnected")
    }

    // Listen for match completed event
    const handleMatchCompleted = (data) => {
      toast.info("Match has ended")
      navigate(`/result/${matchId}`)
    }

    socket.on("match_started", handleMatchStarted)
    socket.on("opponent_code_update", handleOpponentCodeUpdate)
    socket.on("opponent_progress", handleOpponentProgress)
    socket.on("new_message", handleNewMessage)
    socket.on("opponent_disconnected", handleOpponentDisconnected)
    socket.on("match_completed", handleMatchCompleted)

    // Cleanup
    return () => {
      socket.off("match_started", handleMatchStarted)
      socket.off("opponent_code_update", handleOpponentCodeUpdate)
      socket.off("opponent_progress", handleOpponentProgress)
      socket.off("new_message", handleNewMessage)
      socket.off("opponent_disconnected", handleOpponentDisconnected)
      socket.off("match_completed", handleMatchCompleted)
    }
  }, [socket, currentUser, matchId, navigate])

  // Start timer
  useEffect(() => {
    if (timeLeft > 0 && match?.status === "active") {
      // Clear any existing interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }

      // Start a new interval
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current)
            // Time's up, navigate to result page
            navigate(`/result/${matchId}`)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Save the timer state to localStorage for persistence across refreshes
      localStorage.setItem(`match_${matchId}_timeLeft`, timeLeft.toString())
      localStorage.setItem(`match_${matchId}_timestamp`, Date.now().toString())

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
      }
    }
  }, [timeLeft, match, matchId, navigate])

  // Restore timer state on page load/refresh
  useEffect(() => {
    const savedTimeLeft = localStorage.getItem(`match_${matchId}_timeLeft`)
    const savedTimestamp = localStorage.getItem(`match_${matchId}_timestamp`)

    if (savedTimeLeft && savedTimestamp) {
      const elapsedSeconds = Math.floor((Date.now() - Number.parseInt(savedTimestamp)) / 1000)
      const adjustedTimeLeft = Math.max(0, Number.parseInt(savedTimeLeft) - elapsedSeconds)

      if (adjustedTimeLeft > 0) {
        setTimeLeft(adjustedTimeLeft)
      }
    }
  }, [matchId])

  // Send code updates to opponent
  useEffect(() => {
    if (connected && matchId && code) {
      // Debounce code updates to avoid flooding the server
      const debounceTimer = setTimeout(() => {
        sendCodeUpdate(matchId, code, language)

        // Save code to localStorage for persistence across refreshes
        localStorage.setItem(`match_${matchId}_code_${language}`, code)
      }, 1000)

      return () => clearTimeout(debounceTimer)
    }
  }, [code, language, matchId, connected, sendCodeUpdate])

  // Restore code on page load/refresh
  useEffect(() => {
    const savedCode = localStorage.getItem(`match_${matchId}_code_${language}`)
    if (savedCode && !code) {
      setCode(savedCode)
    }
  }, [matchId, language, code])

  // Send progress updates periodically
  useEffect(() => {
    if (connected && matchId) {
      // Calculate progress based on code length and problem difficulty
      const calculateProgress = () => {
        if (!problem || !code) return 0

        // This is a simplified progress calculation
        // In a real app, you might use more sophisticated metrics
        const baseProgress = Math.min(100, (code.length / 500) * 100)

        // Adjust based on problem difficulty
        const difficultyFactor = problem.difficulty === "Easy" ? 1.2 : problem.difficulty === "Medium" ? 1.0 : 0.8

        return Math.min(100, baseProgress * difficultyFactor)
      }

      // Send progress update every 5 seconds
      progressUpdateTimerRef.current = setInterval(() => {
        const progress = calculateProgress()
        sendProgressUpdate(matchId, progress)
      }, 5000)

      return () => {
        if (progressUpdateTimerRef.current) {
          clearInterval(progressUpdateTimerRef.current)
        }
      }
    }
  }, [connected, matchId, problem, code, sendProgressUpdate])

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
  }

  // Run code
  const runCode = async () => {
    if (!matchId) return

    setIsRunning(true)
    setRunOutput("Running code...")

    try {
      const response = await api.post(`/match/${matchId}/run`, {
        code,
        language,
        testCaseIndex: 0, // Run first test case
      })

      const result = response.data.result

      // Format output
      const formattedOutput = `Test Case:\nInput: ${result.input}\nExpected Output: ${result.expectedOutput}\nYour Output: ${result.actualOutput}\nResult: ${result.passed ? "✅ Passed" : "❌ Failed"}\n\n`

      setRunOutput(formattedOutput)
    } catch (error) {
      console.error("Error running code:", error)
      setRunOutput(`Error running code: ${error.response?.data?.message || "Unknown error"}`)
    } finally {
      setIsRunning(false)
    }
  }

  // Submit solution
  const submitSolution = async () => {
    if (!matchId) return

    setIsSubmitting(true)

    try {
      const response = await api.post(`/match/${matchId}/submit`, {
        code,
        language,
      })

      const { isCorrect, match: updatedMatch } = response.data

      if (isCorrect) {
        toast.success("Your solution is correct!")
      } else {
        toast.error("Your solution is incorrect. Please try again.")
        setIsSubmitting(false)
        return
      }

      // If match is completed, navigate to result page
      if (updatedMatch.status === "completed") {
        navigate(`/result/${matchId}`)
      }
    } catch (error) {
      console.error("Error submitting solution:", error)
      toast.error(`Submission error: ${error.response?.data?.message || "Unknown error"}`)
      setIsSubmitting(false)
    }
  }

  // Concede match
  const concedeMatch = async () => {
    if (!matchId) return

    setIsConceding(true)

    try {
      const response = await api.post(`/match/${matchId}/concede`)

      toast.info("You have conceded the match")

      // Navigate to result page
      navigate(`/result/${matchId}`)
    } catch (error) {
      console.error("Error conceding match:", error)
      toast.error(`Error: ${error.response?.data?.message || "Unknown error"}`)
      setIsConceding(false)
      setShowConcedeConfirm(false)
    }
  }

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim() || !matchId) return

    sendChatMessage(matchId, newMessage.trim())
    setNewMessage("")
  }

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
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
    )
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 py-2 px-4 flex-shrink-0">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">{problem.title}</h1>
            <span
              className={`ml-3 px-2 py-1 text-xs rounded-full ${
                problem.difficulty === "Easy"
                  ? "bg-green-900 text-green-300"
                  : problem.difficulty === "Medium"
                    ? "bg-yellow-900 text-yellow-300"
                    : "bg-red-900 text-red-300"
              }`}
            >
              {problem.difficulty}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-red-400 mr-1" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={() => setShowConcedeConfirm(true)}
              className="p-2 rounded-md bg-red-600 hover:bg-red-700 flex items-center"
              title="Concede Match"
            >
              <Flag className="h-5 w-5" />
            </button>

            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-md ${showChat ? "bg-purple-600" : "bg-gray-700 hover:bg-gray-600"}`}
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Problem Statement */}
        <div className="w-1/3 bg-gray-800 overflow-y-auto p-4 border-r border-gray-700">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-xl font-bold mb-4">{problem.title}</h2>
            <div className="whitespace-pre-line">{problem.description}</div>

            {problem.testCases && problem.testCases.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Example Test Cases</h3>
                {problem.testCases
                  .filter((tc) => !tc.isHidden)
                  .map((testCase, index) => (
                    <div key={index} className="mb-4 p-3 bg-gray-700 rounded-md">
                      <div className="mb-1">
                        <strong>Input:</strong> {testCase.input}
                      </div>
                      <div>
                        <strong>Output:</strong> {testCase.output}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value)
                  const savedCode = localStorage.getItem(`match_${matchId}_code_${e.target.value}`)
                  if (savedCode) {
                    setCode(savedCode)
                  } else if (problem.starterCode && problem.starterCode[e.target.value]) {
                    setCode(problem.starterCode[e.target.value])
                  }
                }}
                className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={runCode}
                disabled={isRunning}
                className="flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4 mr-1" />
                Run
              </button>

              <button
                onClick={submitSolution}
                disabled={isSubmitting}
                className="flex items-center px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-1" />
                Submit
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <Editor
              height={editorHeight}
              language={language}
              value={code}
              onChange={setCode}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
              onMount={handleEditorDidMount}
            />
          </div>

          {runOutput && (
            <div className="h-[200px] bg-gray-800 border-t border-gray-700 p-4 font-mono text-sm overflow-y-auto flex-shrink-0">
              <pre className="whitespace-pre-wrap">{runOutput}</pre>
            </div>
          )}
        </div>

        {/* Opponent Progress & Chat */}
        {showChat ? (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-medium">Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.length > 0 ? (
                chatMessages.map((message, index) => (
                  <div key={index} className={`max-w-[80%] ${message.sender.id === currentUser._id ? "ml-auto" : ""}`}>
                    <div
                      className={`rounded-lg p-2 ${
                        message.sender.id === currentUser._id ? "bg-purple-600 text-white" : "bg-gray-700 text-white"
                      }`}
                    >
                      {message.message}
                    </div>
                    <div
                      className={`text-xs text-gray-400 mt-1 ${message.sender.id === currentUser._id ? "text-right" : ""}`}
                    >
                      {message.sender.username},{" "}
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Send a message to your opponent</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-700">
              <div className="flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button onClick={sendMessage} className="bg-purple-600 hover:bg-purple-700 rounded-r px-3 py-2">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Opponent</h3>
                <button onClick={() => setShowChat(true)} className="text-gray-400 hover:text-white">
                  <MessageSquare className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                  {opponent?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{opponent?.username}</div>
                  <div className="text-sm text-gray-400">Rating: {opponent?.rating}</div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-medium mb-2">Progress</h4>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${opponentProgress}%` }}></div>
              </div>
              <div className="text-right text-sm text-gray-400">{Math.round(opponentProgress)}%</div>
            </div>

            <div className="flex-1"></div>

            <div className="p-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                <p className="mb-2">Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Consider using a hash map for O(n) time complexity</li>
                  <li>Check edge cases like empty arrays</li>
                  <li>Test your solution with the provided examples</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Concede Confirmation Modal */}
      {showConcedeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Concede Match</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to concede this match? This will count as a loss and affect your rating.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConcedeConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                disabled={isConceding}
              >
                Cancel
              </button>
              <button
                onClick={concedeMatch}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md flex items-center"
                disabled={isConceding}
              >
                {isConceding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Conceding...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4 mr-2" />
                    Concede
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DuelPage
