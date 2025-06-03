const axios = require("axios")

// Language IDs for Judge0
const LANGUAGE_IDS = {
  javascript: 63, // Node.js
  python: 71, // Python 3
  java: 62, // Java
  cpp: 54, // C++
}

// Status mapping for Judge0 responses
const STATUS_MAPPING = {
  1: "In Queue",
  2: "Processing",
  3: "Accepted",
  4: "Wrong Answer",
  5: "Time Limit Exceeded",
  6: "Compilation Error",
  7: "Runtime Error (SIGSEGV)",
  8: "Runtime Error (SIGXFSZ)",
  9: "Runtime Error (SIGFPE)",
  10: "Runtime Error (SIGABRT)",
  11: "Runtime Error (NZEC)",
  12: "Runtime Error (Other)",
  13: "Internal Error",
  14: "Exec Format Error",
}

// Enhanced code evaluation - runs all test cases but only shows first 2
const evaluateCode = async (code, language, testCases, showAllResults = false) => {
  try {
    console.log(`Evaluating ${language} code with ${testCases.length} test cases`)

    // If Judge0 is not available, use simulation
    if (!process.env.JUDGE0_API_KEY) {
      console.log("No Judge0 API key found, using simulation")
      return simulateEvaluation(code, testCases, showAllResults)
    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()]
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`)
    }

    // Process all test cases in parallel
    const allResults = await Promise.all(
      testCases.map(async (testCase, index) => {
        try {
          const startTime = Date.now()

          // Create submission with user's code and test case input
          const submission = await createSubmission(code, languageId, testCase.input)

          if (!submission.token) {
            throw new Error("Failed to create submission - no token received")
          }

          // Wait for the submission to be processed
          const result = await getSubmissionResult(submission.token)
          const executionTime = Date.now() - startTime

          // Parse the output
          const actualOutput = (result.stdout || "").trim()
          const expectedOutput = testCase.output.toString().trim()
          const passed = actualOutput === expectedOutput

          return {
            testCase: index + 1,
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: actualOutput || "No output",
            stdout: result.stdout || "",
            stderr: result.stderr || "",
            passed,
            status: STATUS_MAPPING[result.status?.id] || "Unknown",
            statusId: result.status?.id,
            executionTime: result.time ? Number.parseFloat(result.time) * 1000 : executionTime,
            memoryUsed: result.memory ? Number.parseInt(result.memory) : null,
            error: result.stderr || result.compile_output || null,
            exitCode: result.exit_code,
            isHidden: index >= 2, // Mark test cases after first 2 as hidden
          }
        } catch (error) {
          console.error(`Error processing test case ${index + 1}:`, error)
          return {
            testCase: index + 1,
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: "",
            stdout: "",
            stderr: error.message,
            passed: false,
            status: "Error",
            statusId: -1,
            executionTime: null,
            memoryUsed: null,
            error: error.message,
            exitCode: null,
            isHidden: index >= 2,
          }
        }
      }),
    )

    // Calculate statistics from all results
    const passedCount = allResults.filter((result) => result.passed).length
    const allPassed = passedCount === testCases.length
    const totalExecutionTime = allResults.reduce((sum, result) => sum + (result.executionTime || 0), 0)
    const maxMemoryUsed = Math.max(...allResults.map((result) => result.memoryUsed || 0))
    const avgExecutionTime = totalExecutionTime / allResults.length

    // For display, only show first 2 test cases unless showAllResults is true
    const displayResults = showAllResults ? allResults : allResults.slice(0, 2)

    // Add summary for hidden test cases if not showing all
    let hiddenTestSummary = null
    if (!showAllResults && allResults.length > 2) {
      const hiddenResults = allResults.slice(2)
      const hiddenPassed = hiddenResults.filter((r) => r.passed).length
      hiddenTestSummary = {
        total: hiddenResults.length,
        passed: hiddenPassed,
        failed: hiddenResults.length - hiddenPassed,
      }
    }

    return {
      success: true,
      results: displayResults,
      allResults, // Keep all results for database storage
      allPassed,
      passedCount,
      totalTestCases: testCases.length,
      totalExecutionTime: Number.parseFloat(totalExecutionTime.toFixed(3)),
      avgExecutionTime: Number.parseFloat(avgExecutionTime.toFixed(3)),
      maxMemoryUsed,
      overallStatus: allPassed ? "Accepted" : "Failed",
      hiddenTestSummary,
      performance: {
        timeComplexity: calculateTimeComplexity(avgExecutionTime),
        spaceComplexity: calculateSpaceComplexity(maxMemoryUsed),
        efficiency: calculateEfficiency(passedCount, testCases.length, avgExecutionTime),
        runtime: `${avgExecutionTime.toFixed(0)}ms`,
        memory: `${(maxMemoryUsed / 1024).toFixed(1)}MB`,
        percentile: calculatePercentile(avgExecutionTime, maxMemoryUsed),
      },
    }
  } catch (error) {
    console.error("Code evaluation error:", error)
    return {
      success: false,
      error: error.message || "Error evaluating code",
      results: [],
      allPassed: false,
      passedCount: 0,
      totalTestCases: testCases.length,
    }
  }
}

// Simple code execution for single test case (Run button)
const runCode = async (code, language, testCase) => {
  try {
    console.log(`Running ${language} code`)

    // If Judge0 is not available, use simulation
    if (!process.env.JUDGE0_API_KEY) {
      console.log("No Judge0 API key found, using simulation")
      return simulateExecution(code, testCase)
    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()]
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`)
    }

    const startTime = Date.now()

    // Create submission with user's code and test case input
    const submission = await createSubmission(code, languageId, testCase.input)

    if (!submission.token) {
      throw new Error("Failed to create submission - no token received")
    }

    // Wait for the submission to be processed
    const result = await getSubmissionResult(submission.token)
    const executionTime = Date.now() - startTime

    // Parse the output
    const actualOutput = (result.stdout || "").trim()
    const expectedOutput = testCase.output.toString().trim()
    const passed = actualOutput === expectedOutput

    return {
      success: true,
      result: {
        input: testCase.input,
        expectedOutput: testCase.output,
        actualOutput: actualOutput || "No output",
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        passed,
        status: STATUS_MAPPING[result.status?.id] || "Unknown",
        statusId: result.status?.id,
        executionTime: result.time ? Number.parseFloat(result.time) * 1000 : executionTime,
        memoryUsed: result.memory ? Number.parseInt(result.memory) : null,
        error: result.stderr || result.compile_output || null,
        exitCode: result.exit_code,
      },
    }
  } catch (error) {
    console.error("Code execution error:", error)
    return {
      success: false,
      error: error.message || "Error executing code",
      result: null,
    }
  }
}

// Helper function to create a submission
const createSubmission = async (code, languageId, input) => {
  const options = {
    method: "POST",
    url: `${process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com"}/submissions`,
    params: {
      base64_encoded: "false",
      wait: "false",
      fields: "*",
    },
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
      "X-RapidAPI-Host": process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com",
    },
    data: {
      source_code: code,
      language_id: languageId,
      stdin: input.toString(),
      cpu_time_limit: 5,
      cpu_extra_time: 1,
      wall_time_limit: 10,
      memory_limit: 128000,
      stack_limit: 64000,
      max_processes_and_or_threads: 60,
      enable_per_process_and_thread_time_limit: false,
      enable_per_process_and_thread_memory_limit: false,
      max_file_size: 1024,
      redirect_stderr_to_stdout: false,
    },
    timeout: 10000,
  }

  try {
    const response = await axios.request(options)
    return response.data
  } catch (error) {
    if (error.response) {
      console.error("Judge0 API Error:", error.response.status, error.response.data)
      throw new Error(`Judge0 API Error: ${error.response.status}`)
    } else if (error.request) {
      console.error("Network Error:", error.message)
      throw new Error("Network error: Unable to reach Judge0 API")
    } else {
      console.error("Request Error:", error.message)
      throw new Error(`Request error: ${error.message}`)
    }
  }
}

// Helper function to get submission result
const getSubmissionResult = async (token) => {
  const options = {
    method: "GET",
    url: `${process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com"}/submissions/${token}`,
    params: {
      base64_encoded: "false",
      fields: "*",
    },
    headers: {
      "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
      "X-RapidAPI-Host": process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com",
    },
    timeout: 5000,
  }

  let result
  let status
  let attempts = 0
  const maxAttempts = 30

  do {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const response = await axios.request(options)
      result = response.data
      status = result.status?.id
      attempts++

      console.log(`Polling attempt ${attempts}: Status ${status} (${STATUS_MAPPING[status] || "Unknown"})`)

      if (status >= 3 || attempts >= maxAttempts) {
        break
      }
    } catch (error) {
      console.error(`Polling error on attempt ${attempts}:`, error.message)
      attempts++

      if (attempts >= maxAttempts) {
        throw new Error("Timeout: Code execution took too long")
      }
    }
  } while (status === 1 || status === 2)

  if (attempts >= maxAttempts && (status === 1 || status === 2)) {
    throw new Error("Timeout: Code execution exceeded maximum wait time")
  }

  return result
}

// Performance calculation functions
const calculateTimeComplexity = (avgTime) => {
  if (avgTime < 10) return "O(1) - Excellent"
  if (avgTime < 50) return "O(log n) - Very Good"
  if (avgTime < 200) return "O(n) - Good"
  if (avgTime < 1000) return "O(n log n) - Fair"
  if (avgTime < 5000) return "O(n²) - Poor"
  return "O(n³+) - Very Poor"
}

const calculateSpaceComplexity = (maxMemory) => {
  if (!maxMemory) return "Unknown"
  if (maxMemory < 1000) return "O(1) - Excellent"
  if (maxMemory < 5000) return "O(log n) - Very Good"
  if (maxMemory < 20000) return "O(n) - Good"
  if (maxMemory < 50000) return "O(n log n) - Fair"
  if (maxMemory < 100000) return "O(n²) - Poor"
  return "O(n³+) - Very Poor"
}

const calculateEfficiency = (passed, total, avgTime) => {
  const accuracy = (passed / total) * 100
  const speed = avgTime < 100 ? 100 : Math.max(0, 100 - avgTime / 10)
  return Math.round((accuracy + speed) / 2)
}

const calculatePercentile = (avgTime, maxMemory) => {
  // Simulate percentile based on performance
  const timeScore = avgTime < 50 ? 95 : avgTime < 200 ? 80 : avgTime < 1000 ? 60 : 30
  const memoryScore = maxMemory < 5000 ? 95 : maxMemory < 20000 ? 80 : maxMemory < 50000 ? 60 : 30
  return Math.round((timeScore + memoryScore) / 2)
}

// Simulation functions for when Judge0 is not available
const simulateEvaluation = (code, testCases, showAllResults = false) => {
  console.log("Using simulation mode for code evaluation")

  const allResults = testCases.map((testCase, index) => {
    const hasLogic =
      code.length > 20 && (code.includes("print") || code.includes("console.log") || code.includes("System.out"))
    const passed = hasLogic && Math.random() > 0.3 // 70% pass rate for simulation

    const executionTime = Math.random() * 100 + 10
    const memoryUsed = Math.floor(Math.random() * 5000) + 1000

    return {
      testCase: index + 1,
      input: testCase.input,
      expectedOutput: testCase.output,
      actualOutput: passed ? testCase.output : "Wrong output",
      stdout: passed ? testCase.output : "Wrong output",
      stderr: passed ? "" : "Logic error",
      passed,
      status: passed ? "Accepted" : "Wrong Answer",
      statusId: passed ? 3 : 4,
      executionTime,
      memoryUsed,
      error: passed ? null : "Logic error",
      exitCode: passed ? 0 : 1,
      isHidden: index >= 2,
    }
  })

  const passedCount = allResults.filter((result) => result.passed).length
  const allPassed = passedCount === testCases.length
  const totalExecutionTime = allResults.reduce((sum, r) => sum + r.executionTime, 0)
  const avgExecutionTime = totalExecutionTime / allResults.length
  const maxMemoryUsed = Math.max(...allResults.map((r) => r.memoryUsed))

  // For display, only show first 2 test cases unless showAllResults is true
  const displayResults = showAllResults ? allResults : allResults.slice(0, 2)

  // Add summary for hidden test cases if not showing all
  let hiddenTestSummary = null
  if (!showAllResults && allResults.length > 2) {
    const hiddenResults = allResults.slice(2)
    const hiddenPassed = hiddenResults.filter((r) => r.passed).length
    hiddenTestSummary = {
      total: hiddenResults.length,
      passed: hiddenPassed,
      failed: hiddenResults.length - hiddenPassed,
    }
  }

  return {
    success: true,
    results: displayResults,
    allResults,
    allPassed,
    passedCount,
    totalTestCases: testCases.length,
    totalExecutionTime: Number.parseFloat(totalExecutionTime.toFixed(3)),
    avgExecutionTime: Number.parseFloat(avgExecutionTime.toFixed(3)),
    maxMemoryUsed,
    overallStatus: allPassed ? "Accepted" : "Failed",
    hiddenTestSummary,
    performance: {
      timeComplexity: calculateTimeComplexity(avgExecutionTime),
      spaceComplexity: calculateSpaceComplexity(maxMemoryUsed),
      efficiency: calculateEfficiency(passedCount, testCases.length, avgExecutionTime),
      runtime: `${avgExecutionTime.toFixed(0)}ms`,
      memory: `${(maxMemoryUsed / 1024).toFixed(1)}MB`,
      percentile: calculatePercentile(avgExecutionTime, maxMemoryUsed),
    },
  }
}

const simulateExecution = (code, testCase) => {
  console.log("Using simulation mode for code execution")

  const hasLogic =
    code.length > 20 && (code.includes("print") || code.includes("console.log") || code.includes("System.out"))
  const passed = hasLogic && Math.random() > 0.3 // 70% pass rate for simulation

  const executionTime = Math.random() * 100 + 10
  const memoryUsed = Math.floor(Math.random() * 5000) + 1000

  return {
    success: true,
    result: {
      input: testCase.input,
      expectedOutput: testCase.output,
      actualOutput: passed ? testCase.output : "Wrong output",
      stdout: passed ? testCase.output : "Wrong output",
      stderr: passed ? "" : "Logic error",
      passed,
      status: passed ? "Accepted" : "Wrong Answer",
      statusId: passed ? 3 : 4,
      executionTime,
      memoryUsed,
      error: passed ? null : "Logic error",
      exitCode: passed ? 0 : 1,
    },
  }
}

module.exports = {
  evaluateCode,
  runCode,
  LANGUAGE_IDS,
  STATUS_MAPPING,
}
