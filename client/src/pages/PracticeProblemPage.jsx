"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import Editor from "@monaco-editor/react"
import { 
  Play, 
  Send, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Tag, 
  ChevronDown, 
  ChevronUp,
  Maximize2,
  Minimize2,
  Code,
  FileText
} from "lucide-react"
import api from "../utils/api"
import { toast } from "react-toastify"

const PracticeProblemPage = () => {
  const { problemId } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [problem, setProblem] = useState(null)
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [runOutput, setRunOutput] = useState("")
  const [submissions, setSubmissions] = useState([])
  const [isSolved, setIsSolved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDescription, setShowDescription] = useState(true)
  const [editorHeight, setEditorHeight] = useState("70vh")
  const [isFullScreenEditor, setIsFullScreenEditor] = useState(false)
  const [activeTab, setActiveTab] = useState("description") // For mobile view: 'description' or 'editor'
  const [outputHeight, setOutputHeight] = useState(200)
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  )

  const editorRef = useRef(null)
  const containerRef = useRef(null)

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      calculateEditorHeight()
    }
    
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Calculate editor height based on window size and other elements
  const calculateEditorHeight = () => {
    if (!containerRef.current) return

    const viewportHeight = window.innerHeight
    const containerTop = containerRef.current.getBoundingClientRect().top
    const toolbarHeight = 48
    const outputAreaHeight = runOutput ? outputHeight : 0
    const footerHeight = 60
    const padding = 16

    // Calculate available height
    let calculatedHeight
    
    if (isFullScreenEditor) {
      calculatedHeight = viewportHeight - toolbarHeight - outputAreaHeight - padding
    } else {
      calculatedHeight = viewportHeight - containerTop - toolbarHeight - outputAreaHeight - footerHeight - padding
    }
    
    // Set minimum height
    calculatedHeight = Math.max(300, calculatedHeight)
    setEditorHeight(`${calculatedHeight}px`)
  }

  useEffect(() => {
    calculateEditorHeight()
  }, [runOutput, isFullScreenEditor, windowWidth])

  // Fetch problem data
  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get(`/practice/problems/${problemId}`)
        const { problem, isSolved, submissions } = response.data

        setProblem(problem)
        setIsSolved(isSolved)
        setSubmissions(submissions)

        // Set initial code from starter code or from previous submission
        const userSubmission = submissions.find((sub) => sub.language === language)

        if (userSubmission) {
          setCode(userSubmission.code)
        } else if (problem.starterCode && problem.starterCode[language]) {
          setCode(problem.starterCode[language])
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching problem data:", error)
        setError("Failed to load problem data. Please try again.")
        setLoading(false)
      }
    }

    if (problemId) {
      fetchProblemData()
    }
  }, [problemId, language])

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    calculateEditorHeight()
  }

  // Run code
  const runCode = async () => {
    if (!problemId) return

    setIsRunning(true)
    setRunOutput("Running code...")

    try {
      const response = await api.post(`/practice/problems/${problemId}/run`, {
        code,
        language,
        testCaseIndex: 0, // Run first test case
      })

      const result = response.data.result

      // Format output
      const formattedOutput = `Test Case:
Input: ${result.input}
Expected Output: ${result.expectedOutput}
Your Output: ${result.actualOutput}
Result: ${result.passed ? "✅ Passed" : "❌ Failed"}
${result.error ? `\nError: ${result.error}` : ""}
`

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
    if (!problemId) return

    setIsSubmitting(true)

    try {
      const response = await api.post(`/practice/problems/${problemId}/submit`, {
        code,
        language,
      })

      const { isCorrect, results } = response.data

      if (isCorrect) {
        toast.success("Your solution is correct!")
        setIsSolved(true)

        // Add to submissions
        setSubmissions([
          {
            code,
            language,
            isCorrect,
            submittedAt: new Date(),
          },
          ...submissions,
        ])
      } else {
        toast.error("Your solution is incorrect. Please try again.")

        // Format results for display
        let formattedOutput = "Submission Results:\n\n"
        results.forEach((result, index) => {
          formattedOutput += `Test Case ${index + 1}:
Input: ${result.input}
Expected Output: ${result.expectedOutput}
Your Output: ${result.actualOutput}
Result: ${result.passed ? "✅ Passed" : "❌ Failed"}
${result.error ? `Error: ${result.error}` : ""}
\n`
        })

        setRunOutput(formattedOutput)
      }
    } catch (error) {
      console.error("Error submitting solution:", error)
      toast.error(`Submission error: ${error.response?.data?.message || "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle fullscreen editor
  const toggleFullScreen = () => {
    setIsFullScreenEditor(!isFullScreenEditor)
  }

  // Resize output area
  const handleResizeOutput = (newHeight) => {
    setOutputHeight(newHeight)
    calculateEditorHeight()
  }

  // Format date
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate("/practice")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-medium transition-colors"
            >
              Return to Practice
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No problem data
  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-900 text-white flex flex-col ${isFullScreenEditor ? 'overflow-hidden' : ''}`}>
      {!isFullScreenEditor && <Navbar />}

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 py-2 sm:py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center">
              <Link to="/practice" className="text-gray-400 hover:text-white mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-bold flex items-center">
                  {problem.title}
                  {isSolved && <CheckCircle className="ml-2 h-5 w-5 text-green-500" />}
                </h1>
                <div className="flex flex-wrap items-center mt-1 gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      problem.difficulty === "Easy"
                        ? "bg-green-900 bg-opacity-20 text-green-500"
                        : problem.difficulty === "Medium"
                          ? "bg-yellow-900 bg-opacity-20 text-yellow-500"
                          : "bg-red-900 bg-opacity-20 text-red-500"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                  {problem.tags &&
                    problem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <div className="text-xs sm:text-sm text-gray-400">
                <span className="font-medium text-white">{problem.solvedCount || 0}</span> solved
              </div>
              
              {/* Mobile tabs buttons */}
              <div className="sm:hidden flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`px-3 py-1 rounded-md text-sm flex items-center ${
                    activeTab === "description" ? "bg-purple-600" : "bg-gray-700"
                  }`}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Problem
                </button>
                <button
                  onClick={() => setActiveTab("editor")}
                  className={`px-3 py-1 rounded-md text-sm flex items-center ${
                    activeTab === "editor" ? "bg-purple-600" : "bg-gray-700"
                  }`}
                >
                  <Code className="h-4 w-4 mr-1" />
                  Code
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row">
          {/* Problem Description - Show on mobile only when activeTab is description */}
          <div
            className={`${
              windowWidth < 768 
                ? activeTab === "description" ? "block" : "hidden" 
                : "block"
            } w-full md:w-2/5 lg:w-1/3 bg-gray-800 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-700`}
          >
            <div className="p-4">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-line">{problem.description}</div>

                {problem.testCases && problem.testCases.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Example Test Cases</h3>
                    {problem.testCases
                      .filter((tc) => !tc.isHidden)
                      .map((testCase, index) => (
                        <div key={index} className="mb-4 p-3 bg-gray-700 rounded-md overflow-x-auto">
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

                {submissions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Your Submissions</h3>
                    <div className="space-y-2">
                      {submissions.slice(0, 5).map((submission, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-md ${
                            submission.isCorrect ? "bg-green-900 bg-opacity-20" : "bg-red-900 bg-opacity-20"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center">
                              {submission.isCorrect ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                              )}
                              <span className="text-sm">
                                {submission.language.charAt(0).toUpperCase() + submission.language.slice(1)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(submission.submittedAt)}</span>
                          </div>
                          <button
                            onClick={() => {
                              setLanguage(submission.language)
                              setCode(submission.code)
                              if (windowWidth < 768) {
                                setActiveTab("editor")
                              }
                            }}
                            className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                          >
                            Load this submission
                          </button>
                        </div>
                      ))}
                      {submissions.length > 5 && (
                        <div className="text-center text-sm text-gray-400">
                          + {submissions.length - 5} more submissions
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code Editor - Show on mobile only when activeTab is editor */}
          <div 
            ref={containerRef}
            className={`${
              windowWidth < 768 
                ? activeTab === "editor" ? "flex" : "hidden" 
                : "flex"
            } flex-1 flex-col relative ${isFullScreenEditor ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}
          >
            <div className="bg-gray-800 border-b border-gray-700 p-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value)
                    // Check if there's a submission for this language
                    const submission = submissions.find((sub) => sub.language === e.target.value)
                    if (submission) {
                      setCode(submission.code)
                    } else if (problem.starterCode && problem.starterCode[e.target.value]) {
                      setCode(problem.starterCode[e.target.value])
                    }
                  }}
                  className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs sm:text-sm"
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
                  className="flex items-center px-2 sm:px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden xs:inline">Run</span>
                </button>

                <button
                  onClick={submitSolution}
                  disabled={isSubmitting}
                  className="flex items-center px-2 sm:px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden xs:inline">Submit</span>
                </button>

                <button
                  onClick={toggleFullScreen}
                  className="flex items-center px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs sm:text-sm"
                >
                  {isFullScreenEditor ? (
                    <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              <Editor
                height={editorHeight}
                language={language}
                value={code}
                onChange={setCode}
                theme="vs-dark"
                options={{
                  minimap: { enabled: windowWidth >= 768 },
                  fontSize: windowWidth < 640 ? 12 : 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: windowWidth < 768 ? 'on' : 'off',
                  lineNumbers: windowWidth >= 480 ? 'on' : 'off',
                }}
                onMount={handleEditorDidMount}
              />
            </div>

            {runOutput && (
              <div 
                className="bg-gray-800 border-t border-gray-700 p-4 font-mono text-xs sm:text-sm overflow-y-auto"
                style={{ height: `${outputHeight}px` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold">Output</div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleResizeOutput(Math.max(100, outputHeight - 50))}
                      className="text-gray-400 hover:text-white"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleResizeOutput(Math.min(400, outputHeight + 50))}
                      className="text-gray-400 hover:text-white"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap overflow-x-auto">{runOutput}</pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isFullScreenEditor && <Footer />}
    </div>
  )
}

export default PracticeProblemPage