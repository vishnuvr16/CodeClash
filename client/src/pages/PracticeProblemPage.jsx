import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Editor } from "@monaco-editor/react"
import {
  Play,
  Send,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Maximize2,
  Minimize2,
  RotateCcw,
  Lightbulb,
  Code2,
  Info,
  Zap,
  BarChart3,
  TrendingUp,
  Award,
  Eye,
  EyeOff,
  Activity,
} from "lucide-react"
import api from "../utils/api"
import { toast } from "react-toastify"

const PracticeProblemPage = () => {
  const { problemId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const editorRef = useRef(null)

  // Problem and submission state
  const [problem, setProblem] = useState(null)
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // UI state
  const [activeTab, setActiveTab] = useState("description")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(50)
  const [showSettings, setShowSettings] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)

  // Results state
  const [testResults, setTestResults] = useState([])
  const [submissionHistory, setSubmissionHistory] = useState([])
  const [currentTestCase, setCurrentTestCase] = useState(0)
  const [performance, setPerformance] = useState(null)
  const [hiddenTestSummary, setHiddenTestSummary] = useState(null)

  // Editor settings
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 14,
    theme: "vs-dark",
    wordWrap: "on",
    minimap: false,
  })

  // Language configurations with starter templates
  const languages = {
    javascript: {
      name: "JavaScript",
      template: `// Read input from stdin
const input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();

// Process input
const lines = input.split('\\n');
const firstLine = lines[0];

// Your solution here
console.log("Hello World");

// Example: For sum of two numbers
// const [a, b] = firstLine.split(' ').map(Number);
// console.log(a + b);`,
      extension: "js",
    },
    python: {
      name: "Python",
      template: `# Read input from stdin
import sys
input_data = sys.stdin.read().strip()

# Process input
lines = input_data.split('\\n')
first_line = lines[0]

# Your solution here
print("Hello World")

# Example: For sum of two numbers
# a, b = map(int, first_line.split())
# print(a + b)`,
      extension: "py",
    },
    java: {
      name: "Java",
      template: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        // Read input
        String firstLine = br.readLine();
        
        // Your solution here
        System.out.println("Hello World");
        
        // Example: For sum of two numbers
        // String[] parts = firstLine.split(" ");
        // int a = Integer.parseInt(parts[0]);
        // int b = Integer.parseInt(parts[1]);
        // System.out.println(a + b);
        
        br.close();
    }
}`,
      extension: "java",
    },
    cpp: {
      name: "C++",
      template: `#include <iostream>
#include <string>
#include <vector>
#include <sstream>
using namespace std;

int main() {
    // Read input
    string firstLine;
    getline(cin, firstLine);
    
    // Your solution here
    cout << "Hello World" << endl;
    
    // Example: For sum of two numbers
    // istringstream iss(firstLine);
    // int a, b;
    // iss >> a >> b;
    // cout << a + b << endl;
    
    return 0;
}`,
      extension: "cpp",
    },
  }

  // Load problem data
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setIsLoading(true)
        const response = await api.get(`/practice/problems/${problemId}`)
        setProblem(response.data.problem)

        // Load saved code or use template
        const savedCode = localStorage.getItem(`practice_${problemId}_${language}`)
        if (savedCode) {
          setCode(savedCode)
        } else {
          setCode(languages[language].template)
        }

        // Load submission history
        try {
          const historyResponse = await api.get(`/practice/problems/${problemId}/submissions`)
          setSubmissionHistory(historyResponse.data.submissions || [])
        } catch (error) {
          // console.log("No submission history available")
        }
      } catch (error) {
        // console.error("Error fetching problem:", error)
        toast.error("Failed to load problem")
        navigate("/practice")
      } finally {
        setIsLoading(false)
      }
    }

    if (problemId) {
      fetchProblem()
    }
  }, [problemId, navigate])

  // Save code to localStorage when it changes
  useEffect(() => {
    if (code && problemId) {
      localStorage.setItem(`practice_${problemId}_${language}`, code)
    }
  }, [code, language, problemId])

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    // Save current code
    if (code && problemId) {
      localStorage.setItem(`practice_${problemId}_${language}`, code)
    }

    setLanguage(newLanguage)

    // Load saved code for new language or use template
    const savedCode = localStorage.getItem(`practice_${problemId}_${newLanguage}`)
    if (savedCode) {
      setCode(savedCode)
    } else {
      setCode(languages[newLanguage].template)
    }
  }

  // Run code against sample test cases
  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error("Please write some code first")
      return
    }

    setIsRunning(true)
    try {
      const response = await api.post(`/practice/problems/${problemId}/run`, {
        code,
        language,
        testCaseIndex: currentTestCase,
      })

      setTestResults([response.data.result])
      setActiveTab("output")

      if (response.data.result.passed) {
        toast.success("Test case passed!")
      } else {
        toast.error("Test case failed")
      }
    } catch (error) {
      console.error("Error running code:", error)
      toast.error("Failed to run code")
    } finally {
      setIsRunning(false)
    }
  }

  // Submit solution
  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("Please write some code first")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.post(`/practice/problems/${problemId}/submit`, {
        code,
        language,
      })

      setTestResults(response.data.results)
      setPerformance(response.data.performance)
      setHiddenTestSummary(response.data.hiddenTestSummary)
      setActiveTab("output")

      if (response.data.isCorrect) {
        toast.success("🎉 Congratulations! All test cases passed!")
        // Refresh submission history
        try {
          const historyResponse = await api.get(`/practice/problems/${problemId}/submissions`)
          setSubmissionHistory(historyResponse.data.submissions || [])
        } catch (error) {
          // console.log("Could not refresh submission history")
        }
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      // console.error("Error submitting code:", error)
      toast.error("Failed to submit solution")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset code to template
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset your code? This action cannot be undone.")) {
      setCode(languages[language].template)
      localStorage.removeItem(`practice_${problemId}_${language}`)
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Handle panel resize
  const handleMouseDown = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = leftPanelWidth

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX
      const containerWidth = window.innerWidth
      const newWidth = Math.min(Math.max(20, startWidth + (deltaX / containerWidth) * 100), 80)
      setLeftPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Problem Not Found</h2>
          <button
            onClick={() => navigate("/practice")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          >
            Back to Practice
          </button>
        </div>
      </div>
    )
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-400 bg-green-900/20"
      case "Medium":
        return "text-yellow-400 bg-yellow-900/20"
      case "Hard":
        return "text-red-400 bg-red-900/20"
      default:
        return "text-gray-400 bg-gray-900/20"
    }
  }

  return (
    <div className={`bg-gray-900 text-white ${isFullscreen ? "fixed inset-0 z-50" : "min-h-screen"}`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/practice")}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Practice
          </button>
          <div className="h-6 w-px bg-gray-600"></div>
          <h1 className="text-lg font-semibold">{problem.title}</h1>
          <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
          <div className="flex items-center text-sm text-yellow-400">
            <Award className="h-4 w-4 mr-1" />
            {problem.trophyReward} trophies
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Font Size:</label>
              <select
                value={editorSettings.fontSize}
                onChange={(e) => setEditorSettings((prev) => ({ ...prev, fontSize: Number.parseInt(e.target.value) }))}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
                <option value={20}>20px</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Theme:</label>
              <select
                value={editorSettings.theme}
                onChange={(e) => setEditorSettings((prev) => ({ ...prev, theme: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value="vs-dark">Dark</option>
                <option value="light">Light</option>
                <option value="hc-black">High Contrast</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Word Wrap:</label>
              <select
                value={editorSettings.wordWrap}
                onChange={(e) => setEditorSettings((prev) => ({ ...prev, wordWrap: e.target.value }))}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value="off">Off</option>
                <option value="on">On</option>
                <option value="wordWrapColumn">Column</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-full pb-3" style={{ height: isFullscreen ? "100vh" : "calc(100vh - 0px)" }}>
        {/* Left Panel - Problem Description */}
        <div
          className="bg-gray-800 pb-10 border-r border-gray-700 overflow-hidden flex flex-col"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab("description")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "description"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("output")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "output"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Output{" "}
              {testResults.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                  {testResults.filter((r) => r.passed).length}/{testResults.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "submissions"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Submissions ({submissionHistory.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "description" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">{problem.title}</h2>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">{problem.description}</div>
                  </div>
                </div>

                {problem.examples && problem.examples.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Examples</h3>
                    {problem.examples.map((example, index) => (
                      <div key={index} className="bg-gray-900 rounded-lg p-4 mb-4">
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-400">Input:</span>
                          <pre className="mt-1 text-sm bg-gray-800 p-2 rounded overflow-x-auto">{example.input}</pre>
                        </div>
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-400">Output:</span>
                          <pre className="mt-1 text-sm bg-gray-800 p-2 rounded overflow-x-auto">{example.output}</pre>
                        </div>
                        {example.explanation && (
                          <div>
                            <span className="text-sm font-medium text-gray-400">Explanation:</span>
                            <p className="mt-1 text-sm text-gray-300">{example.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {problem.constraints && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Constraints</h3>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap">{problem.constraints}</pre>
                    </div>
                  </div>
                )}

                {problem.hints && problem.hints.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
                      Hints
                    </h3>
                    {problem.hints.map((hint, index) => (
                      <div key={index} className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-2">
                        <p className="text-sm text-yellow-200">{hint}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "output" && (
              <div className="space-y-4">
                {testResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Code2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Run your code to see the output</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Performance Insights*/}
                    {performance && (
                      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700 rounded-lg p-6">
                        <h4 className="font-medium text-green-400 mb-4 flex items-center">
                          <BarChart3 className="h-5 w-5 mr-2" />
                          Performance Analysis
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="space-y-4">
                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Runtime</span>
                                <Clock className="h-4 w-4 text-green-400" />
                              </div>
                              <p className="text-2xl font-bold text-white">{performance.runtime}</p>
                              <p className="text-xs text-green-400">Beats {performance.percentile}% of submissions</p>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Memory</span>
                                <Activity className="h-4 w-4 text-blue-400" />
                              </div>
                              <p className="text-2xl font-bold text-white">{performance.memory}</p>
                              <p className="text-xs text-blue-400">Beats {performance.percentile}% of submissions</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Time Complexity</span>
                                <TrendingUp className="h-4 w-4 text-purple-400" />
                              </div>
                              <p className="text-lg font-medium text-white">{performance.timeComplexity}</p>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Space Complexity</span>
                                <Zap className="h-4 w-4 text-cyan-400" />
                              </div>
                              <p className="text-lg font-medium text-white">{performance.spaceComplexity}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Overall Efficiency Score</span>
                            <Award className="h-4 w-4 text-yellow-400" />
                          </div>
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-700 rounded-full h-3 mr-3">
                              <div
                                className="bg-gradient-to-r from-yellow-400 to-green-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${performance.efficiency}%` }}
                              ></div>
                            </div>
                            <span className="text-lg font-bold text-yellow-400">{performance.efficiency}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hidden Test Cases Summary */}
                    {hiddenTestSummary && (
                      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-300 flex items-center">
                            <EyeOff className="h-5 w-5 mr-2" />
                            Hidden Test Cases
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-green-400">{hiddenTestSummary.passed} passed</span>
                            <span className="text-sm text-red-400">{hiddenTestSummary.failed} failed</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-700 rounded-full h-2 mr-3">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(hiddenTestSummary.passed / hiddenTestSummary.total) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-400">
                            {hiddenTestSummary.passed}/{hiddenTestSummary.total}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Visible Test Results */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-300 flex items-center">
                        <Eye className="h-5 w-5 mr-2" />
                        Sample Test Cases
                      </h4>
                      {testResults.map((result, index) => (
                        <div key={index} className="bg-gray-900 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium">Test Case {index + 1}</h5>
                            <div className="flex items-center">
                              {result.passed ? (
                                <CheckCircle className="h-5 w-5 text-green-400" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-400" />
                              )}
                              <span className={`ml-2 text-sm ${result.passed ? "text-green-400" : "text-red-400"}`}>
                                {result.passed ? "Passed" : "Failed"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-400">Input:</span>
                              <pre className="mt-1 text-sm bg-gray-800 p-2 rounded overflow-x-auto">{result.input}</pre>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-400">Expected Output:</span>
                              <pre className="mt-1 text-sm bg-gray-800 p-2 rounded overflow-x-auto">
                                {result.expectedOutput}
                              </pre>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-400">Your Output:</span>
                              <pre
                                className={`mt-1 text-sm p-2 rounded overflow-x-auto ${
                                  result.passed
                                    ? "bg-green-900/20 border border-green-700"
                                    : "bg-red-900/20 border border-red-700"
                                }`}
                              >
                                {result.actualOutput || "No output"}
                              </pre>
                            </div>
                            {result.stdout && result.stdout !== result.actualOutput && (
                              <div>
                                <span className="text-sm font-medium text-blue-400">Console Output:</span>
                                <pre className="mt-1 text-sm bg-blue-900/20 border border-blue-700 p-2 rounded overflow-x-auto">
                                  {result.stdout}
                                </pre>
                              </div>
                            )}
                            {result.stderr && (
                              <div>
                                <span className="text-sm font-medium text-red-400">Error:</span>
                                <pre className="mt-1 text-sm bg-red-900/20 border border-red-700 p-2 rounded overflow-x-auto">
                                  {result.stderr}
                                </pre>
                              </div>
                            )}
                            {result.executionTime && (
                              <div className="flex items-center text-sm text-gray-400">
                                <Clock className="h-4 w-4 mr-1" />
                                Execution Time: {result.executionTime}ms
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="space-y-4">
                {submissionHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Send className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No submissions yet</p>
                  </div>
                ) : (
                  submissionHistory.map((submission, index) => (
                    <div key={index} className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-3 py-1 text-sm rounded-full font-medium ${
                              submission.status === "Accepted"
                                ? "bg-green-900/20 text-green-400 border border-green-700"
                                : "bg-red-900/20 text-red-400 border border-red-700"
                            }`}
                          >
                            {submission.status}
                          </span>
                          <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
                            {submission.language}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {new Date(submission.submittedAt).toLocaleString()}
                        </span>
                      </div>

                      {submission.performance && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div className="text-sm">
                            <span className="text-gray-400">Runtime: </span>
                            <span className="text-white font-medium">{submission.performance.runtime}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-400">Memory: </span>
                            <span className="text-white font-medium">{submission.performance.memory}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="w-1 bg-gray-700 hover:bg-purple-500 cursor-col-resize transition-colors"
          onMouseDown={handleMouseDown}
        />

        {/* Right Panel - Code Editor */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Editor Header */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {Object.entries(languages).map(([key, lang]) => (
                  <option key={key} value={key}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleReset}
                className="flex items-center px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </button>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                <Info className="h-4 w-4 mr-1" />
                {showInstructions ? "Hide Instructions" : "Show Instructions"}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-md transition-colors"
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? "Running..." : "Run"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-md transition-colors"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>

          {/* Instructions Banner */}
          {showInstructions && (
            <div className="bg-blue-900/30 border-b border-blue-700 p-3 text-sm text-blue-200">
              <div className="flex items-start">
                <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Instructions:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>Write complete code that reads from stdin and writes to stdout</li>
                    <li>Use the provided template as a starting point</li>
                    <li>Your code will be tested against multiple test cases</li>
                    <li>Make sure your output format exactly matches the expected output</li>
                    <li>Click "Run" to test against the first example</li>
                    <li>Click "Submit" to test against all test cases and save your submission</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Code Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={setCode}
              theme={editorSettings.theme}
              onMount={(editor) => {
                editorRef.current = editor
              }}
              options={{
                fontSize: editorSettings.fontSize,
                wordWrap: editorSettings.wordWrap,
                minimap: { enabled: editorSettings.minimap },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                renderWhitespace: "selection",
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true,
                },
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: "on",
                quickSuggestions: true,
              }}
            />
          </div>
        </div>
      </div>

    </div>
  )
}

export default PracticeProblemPage
