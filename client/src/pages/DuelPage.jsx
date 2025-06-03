"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSocket } from "../contexts/SocketContext"
import { useAuth } from "../contexts/AuthContext"
import Editor from "@monaco-editor/react"
import {
  Play,
  Send,
  Clock,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  Flag,
  Code,
  Trophy,
  Zap,
  CheckCircle,
} from "lucide-react"
import api from "../utils/api"
import { toast } from "react-toastify"

const DuelPage = () => {
  const { matchId } = useParams()
  const { socket, connected, joinMatch, sendCodeUpdate, sendProgressUpdate, sendChatMessage } = useSocket()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  // Match and problem state
  const [match, setMatch] = useState(null)
  const [problem, setProblem] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Code editor state
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [savedCodes, setSavedCodes] = useState({}) // Store code for each language

  // Match state
  const [timeLeft, setTimeLeft] = useState(1800)
  const [matchStatus, setMatchStatus] = useState("pending")
  const [isRunning, setIsRunning] = useState(false)
  const [runOutput, setRunOutput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConceding, setIsConceding] = useState(false)
  const [showConcedeConfirm, setShowConcedeConfirm] = useState(false)

  // Real-time features
  const [opponentProgress, setOpponentProgress] = useState(0)
  const [myProgress, setMyProgress] = useState(0)
  const [opponentCode, setOpponentCode] = useState("")
  const [opponentLanguage, setOpponentLanguage] = useState("javascript")
  const [opponentStatus, setOpponentStatus] = useState("coding") // coding, running, submitted

  // Chat state
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")

  // Refs
  const editorRef = useRef(null)
  const chatContainerRef = useRef(null)
  const progressUpdateTimerRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const codeUpdateTimerRef = useRef(null)

  // Fetch match data
  const fetchMatchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`/match/${matchId}`)
      const matchData = response.data

      setMatch(matchData)
      setProblem(matchData.problem)
      setMatchStatus(matchData.status)

      // Determine opponent
      const isUserA = matchData.userA._id === currentUser._id
      setOpponent(isUserA ? matchData.userB : matchData.userA)

      // Load saved codes from localStorage or starter code
      const savedCodesFromStorage = {}
      const languages = ["javascript", "python", "java"]

      languages.forEach((lang) => {
        const savedCode = localStorage.getItem(`match_${matchId}_code_${lang}`)
        if (savedCode) {
          savedCodesFromStorage[lang] = savedCode
        } else if (matchData.problem.starterCode && matchData.problem.starterCode[lang]) {
          savedCodesFromStorage[lang] = matchData.problem.starterCode[lang]
        } else {
          // Default starter code
          savedCodesFromStorage[lang] = getDefaultStarterCode(lang)
        }
      })

      setSavedCodes(savedCodesFromStorage)
      setCode(savedCodesFromStorage[language] || "")

      // Set time left
      if (matchData.startTime && matchData.status === "active") {
        const startTime = new Date(matchData.startTime)
        const timeLimit = matchData.problem.timeLimit || 1800
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
  }, [matchId, currentUser, language])

  // Get default starter code for each language
  const getDefaultStarterCode = (lang) => {
    const templates = {
      javascript: `function solution(input) {
    // Your code here
    return "";
}

// Example usage:
// console.log(solution("test input"));`,
      python: `def solution(input_str):
    # Your code here
    return ""

# Example usage:
# print(solution("test input"))`,
      java: `public class Solution {
    public static String solution(String input) {
        // Your code here
        return "";
    }
    
    public static void main(String[] args) {
        // Example usage:
        // System.out.println(solution("test input"));
    }
}`,
    }
    return templates[lang] || templates.javascript
  }

  // Calculate progress based on code complexity
  const calculateProgress = useCallback(
    (currentCode) => {
      if (!problem || !currentCode) return 0

      // Simple progress calculation based on multiple factors
      const codeLength = currentCode.length
      const lineCount = currentCode.split("\n").length
      const hasFunction = /function|def|public/.test(currentCode)
      const hasLogic = /if|for|while|return/.test(currentCode)

      let progress = 0

      // Base progress from code length (0-40%)
      progress += Math.min(40, (codeLength / 200) * 40)

      // Progress from line count (0-20%)
      progress += Math.min(20, (lineCount / 10) * 20)

      // Bonus for having function structure (0-20%)
      if (hasFunction) progress += 20

      // Bonus for having logic (0-20%)
      if (hasLogic) progress += 20

      return Math.min(100, Math.round(progress))
    },
    [problem],
  )

  // Handle language change without page reload
  const handleLanguageChange = (newLanguage) => {
    // Save current code
    const updatedCodes = {
      ...savedCodes,
      [language]: code,
    }
    setSavedCodes(updatedCodes)
    localStorage.setItem(`match_${matchId}_code_${language}`, code)

    // Switch to new language
    setLanguage(newLanguage)
    setCode(updatedCodes[newLanguage] || getDefaultStarterCode(newLanguage))
  }

  // Handle code changes with debounced updates
  const handleCodeChange = (newCode) => {
    setCode(newCode)

    // Update progress
    const progress = calculateProgress(newCode)
    setMyProgress(progress)

    // Clear existing timer
    if (codeUpdateTimerRef.current) {
      clearTimeout(codeUpdateTimerRef.current)
    }

    // Debounced code update to opponent
    codeUpdateTimerRef.current = setTimeout(() => {
      if (connected && matchId) {
        sendCodeUpdate(matchId, newCode, language)
        localStorage.setItem(`match_${matchId}_code_${language}`, newCode)
      }
    }, 1000)
  }

  // Send progress updates
  useEffect(() => {
    if (connected && matchId && matchStatus === "active") {
      progressUpdateTimerRef.current = setInterval(() => {
        sendProgressUpdate(matchId, myProgress)
      }, 3000) // Send every 3 seconds

      return () => {
        if (progressUpdateTimerRef.current) {
          clearInterval(progressUpdateTimerRef.current)
        }
      }
    }
  }, [connected, matchId, myProgress, matchStatus, sendProgressUpdate])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && matchStatus === "active") {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current)
            toast.warning("Time's up!")
            navigate(`/result/${matchId}`)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
      }
    }
  }, [timeLeft, matchStatus, matchId, navigate])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleMatchStarted = (data) => {
      setMatchStatus("active")
      toast.success("Match started! Good luck!")
    }

    const handleOpponentCodeUpdate = (data) => {
      setOpponentCode(data.code)
      setOpponentLanguage(data.language)
    }

    const handleOpponentProgress = (data) => {
      if (data.userId !== currentUser._id) {
        setOpponentProgress(data.progress)
      }
    }

    const handleOpponentStatus = (data) => {
      setOpponentStatus(data.status)
    }

    const handleNewMessage = (data) => {
      setChatMessages((prev) => [...prev, data])
    }

    const handleOpponentDisconnected = () => {
      toast.warning("Your opponent has disconnected")
      setOpponentStatus("disconnected")
    }

    const handleMatchCompleted = (data) => {
      setMatchStatus("completed")
      toast.success("Match completed!")
      setTimeout(() => {
        navigate(`/result/${matchId}`)
      }, 2000)
    }

    const handleOpponentConceded = (data) => {
      setMatchStatus("completed")
      toast.success("Your opponent conceded! You win!")
      setTimeout(() => {
        navigate(`/result/${matchId}`)
      }, 2000)
    }

    socket.on("match_started", handleMatchStarted)
    socket.on("opponent_code_update", handleOpponentCodeUpdate)
    socket.on("opponent_progress", handleOpponentProgress)
    socket.on("opponent_status", handleOpponentStatus)
    socket.on("new_message", handleNewMessage)
    socket.on("opponent_disconnected", handleOpponentDisconnected)
    socket.on("match_completed", handleMatchCompleted)
    socket.on("opponent_conceded", handleOpponentConceded)

    return () => {
      socket.off("match_started", handleMatchStarted)
      socket.off("opponent_code_update", handleOpponentCodeUpdate)
      socket.off("opponent_progress", handleOpponentProgress)
      socket.off("opponent_status", handleOpponentStatus)
      socket.off("new_message", handleNewMessage)
      socket.off("opponent_disconnected", handleOpponentDisconnected)
      socket.off("match_completed", handleMatchCompleted)
      socket.off("opponent_conceded", handleOpponentConceded)
    }
  }, [socket, currentUser, matchId, navigate])

  // Join match on component mount
  useEffect(() => {
    if (connected && matchId) {
      joinMatch(matchId)
    }
  }, [connected, matchId, joinMatch])

  // Fetch match data on mount
  useEffect(() => {
    if (matchId && currentUser) {
      fetchMatchData()
    }
  }, [matchId, currentUser, fetchMatchData])

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Run code
  const runCode = async () => {
    setIsRunning(true)
    setRunOutput("Running code...")
    setOpponentStatus("running")

    try {
      const response = await api.post(`/match/${matchId}/run`, {
        code,
        language,
        testCaseIndex: 0,
      })

      const result = response.data.result
      const output = `Input: ${result.input}\nExpected: ${result.expectedOutput}\nYour Output: ${result.actualOutput}\nStatus: ${result.passed ? "✅ Passed" : "❌ Failed"}`

      setRunOutput(output)
    } catch (error) {
      console.error("Error running code:", error)
      setRunOutput(`Error: ${error.response?.data?.message || "Unknown error"}`)
    } finally {
      setIsRunning(false)
      setOpponentStatus("coding")
    }
  }

  // Submit solution
  const submitSolution = async () => {
    setIsSubmitting(true)
    setOpponentStatus("submitted")

    try {
      const response = await api.post(`/match/${matchId}/submit`, {
        code,
        language,
      })

      const { isCorrect, match: updatedMatch } = response.data

      if (isCorrect) {
        toast.success("Correct solution! You win!")
        setMatchStatus("completed")
        setTimeout(() => {
          navigate(`/result/${matchId}`)
        }, 2000)
      } else {
        toast.error("Incorrect solution. Keep trying!")
        setIsSubmitting(false)
        setOpponentStatus("coding")
      }
    } catch (error) {
      console.error("Error submitting solution:", error)
      toast.error(`Submission error: ${error.response?.data?.message || "Unknown error"}`)
      setIsSubmitting(false)
      setOpponentStatus("coding")
    }
  }

  // Concede match
  const concedeMatch = async () => {
    setIsConceding(true)

    try {
      await api.post(`/match/${matchId}/concede`)
      toast.info("You have conceded the match")
      setMatchStatus("completed")
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

  // Scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading match...</p>
        </div>
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

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Enhanced Header */}
      <header className="bg-gray-800 border-b border-gray-700 py-3 px-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Trophy className="h-6 w-6 text-yellow-400 mr-2" />
              <h1 className="text-xl font-bold">{problem?.title}</h1>
              <span
                className={`ml-3 px-2 py-1 text-xs rounded-full font-medium ${
                  problem?.difficulty === "Easy"
                    ? "bg-green-900 text-green-300"
                    : problem?.difficulty === "Medium"
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-red-900 text-red-300"
                }`}
              >
                {problem?.difficulty}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Status:</span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  matchStatus === "active"
                    ? "bg-green-900 text-green-300"
                    : matchStatus === "pending"
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-gray-700 text-gray-300"
                }`}
              >
                {matchStatus.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-700 rounded-lg px-3 py-2">
              <Clock className="h-5 w-5 text-red-400 mr-2" />
              <span className={`font-mono text-lg font-bold ${timeLeft < 300 ? "text-red-400" : "text-white"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <button
              onClick={() => setShowConcedeConfirm(true)}
              className="p-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors flex items-center"
              title="Concede Match"
            >
              <Flag className="h-5 w-5" />
            </button>

            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-md transition-colors ${
                showChat ? "bg-purple-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Problem Statement */}
        <div className="w-1/3 bg-gray-800 overflow-y-auto border-r border-gray-700">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4 text-white">{problem?.title}</h2>
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-line text-gray-300 leading-relaxed">{problem?.description}</div>
              </div>
            </div>

            {problem?.testCases && problem.testCases.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Example Test Cases</h3>
                {problem.testCases
                  .filter((tc) => !tc.isHidden)
                  .map((testCase, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-400">Input:</span>
                        <div className="mt-1 p-2 bg-gray-800 rounded text-sm font-mono text-green-400">
                          {testCase.input}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-400">Output:</span>
                        <div className="mt-1 p-2 bg-gray-800 rounded text-sm font-mono text-blue-400">
                          {testCase.output}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Toolbar */}
          <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-4">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>

              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Zap className="h-4 w-4" />
                <span>Progress: {myProgress}%</span>
                <div className="w-20 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${myProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={runCode}
                disabled={isRunning || matchStatus !== "active"}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? "Running..." : "Run"}
              </button>

              <button
                onClick={submitSolution}
                disabled={isSubmitting || matchStatus !== "active"}
                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: "on",
                lineNumbers: "on",
                folding: true,
                bracketMatching: "always",
              }}
              onMount={(editor) => {
                editorRef.current = editor
              }}
            />
          </div>

          {/* Output Panel */}
          {runOutput && (
            <div className="h-48 bg-gray-800 border-t border-gray-700 p-4 font-mono text-sm overflow-y-auto flex-shrink-0">
              <div className="flex items-center mb-2">
                <Code className="h-4 w-4 mr-2 text-green-400" />
                <span className="font-medium text-white">Output:</span>
              </div>
              <pre className="whitespace-pre-wrap text-gray-300">{runOutput}</pre>
            </div>
          )}
        </div>

        {/* Sidebar - Chat or Opponent Info */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col flex-shrink-0">
          {showChat ? (
            <>
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="font-medium text-white">Chat</h3>
                <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length > 0 ? (
                  chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`max-w-[80%] ${message.sender.id === currentUser._id ? "ml-auto" : ""}`}
                    >
                      <div
                        className={`rounded-lg p-3 ${
                          message.sender.id === currentUser._id ? "bg-purple-600 text-white" : "bg-gray-700 text-white"
                        }`}
                      >
                        {message.message}
                      </div>
                      <div
                        className={`text-xs text-gray-400 mt-1 ${
                          message.sender.id === currentUser._id ? "text-right" : ""
                        }`}
                      >
                        {message.sender.username},{" "}
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm mt-2">Send a message to your opponent</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-purple-600 hover:bg-purple-700 rounded-r px-3 py-2 transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-white">Opponent</h3>
                  <button
                    onClick={() => setShowChat(true)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                    {opponent?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-white">{opponent?.username}</div>
                    <div className="text-sm text-gray-400">Rating: {opponent?.rating}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      opponentStatus === "coding"
                        ? "bg-green-400"
                        : opponentStatus === "running"
                          ? "bg-yellow-400"
                          : opponentStatus === "submitted"
                            ? "bg-blue-400"
                            : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-gray-400 capitalize">{opponentStatus}</span>
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-medium mb-3 text-white">Progress</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">You</span>
                      <span className="text-white">{myProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${myProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{opponent?.username}</span>
                      <span className="text-white">{opponentProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${opponentProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1"></div>

              <div className="p-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  <p className="mb-3 font-medium text-white">Tips:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Test with provided examples first</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Consider edge cases</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Optimize for time complexity</span>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Concede Confirmation Modal */}
      {showConcedeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-xl font-bold text-white">Concede Match</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to concede this match? This will count as a loss and affect your rating.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConcedeConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-white"
                disabled={isConceding}
              >
                Cancel
              </button>
              <button
                onClick={concedeMatch}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md flex items-center transition-colors text-white"
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

export default DuelPage;
