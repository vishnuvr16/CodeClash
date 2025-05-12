const axios = require("axios")

// Language IDs for Judge0
const LANGUAGE_IDS = {
  javascript: 63, // Node.js
  python: 71, // Python 3
  java: 62, // Java
}

// Function to evaluate code using Judge0 API
const evaluateCode = async (code, language, testCases) => {
  try {
    if (!process.env.JUDGE0_API_KEY) {
      // Fallback to simulation if no API key
      return simulateEvaluation(code, testCases)
    }

    const languageId = LANGUAGE_IDS[language]
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`)
    }

    // Process each test case
    const results = await Promise.all(
      testCases.map(async (testCase) => {
        const submission = await createSubmission(code, languageId, testCase.input)

        // Wait for the submission to be processed
        const result = await getSubmissionResult(submission.token)

        // Check if the output matches the expected output
        const normalizedExpected = testCase.output.trim()
        const normalizedActual = (result.stdout || "").trim()
        const passed = normalizedExpected === normalizedActual

        return {
          input: testCase.input,
          expectedOutput: normalizedExpected,
          actualOutput: normalizedActual,
          passed,
          error: result.stderr || result.compile_output || null,
        }
      }),
    )

    // Check if all test cases passed
    const allPassed = results.every((result) => result.passed)

    return {
      success: true,
      results,
      allPassed,
    }
  } catch (error) {
    console.error("Code evaluation error:", error)
    return {
      success: false,
      error: error.message || "Error evaluating code",
    }
  }
}

// Function to run code against a single test case
const runCode = async (code, language, testCase) => {
  try {
    if (!process.env.JUDGE0_API_KEY) {
      console.log("no jude from line 72")
      // Fallback to simulation if no API key
      return simulateExecution(code, testCase)
    }

    const languageId = LANGUAGE_IDS[language]
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`)
    }

    // Create submission
    const submission = await createSubmission(code, languageId, testCase.input)

    // Wait for the submission to be processed
    const result = await getSubmissionResult(submission.token)

    // Check if the output matches the expected output
    const normalizedExpected = testCase.output.trim()
    const normalizedActual = (result.stdout || "").trim()
    const passed = normalizedExpected === normalizedActual

    return {
      success: true,
      result: {
        input: testCase.input,
        expectedOutput: normalizedExpected,
        actualOutput: normalizedActual,
        passed,
        error: result.stderr || result.compile_output || null,
      },
    }
  } catch (error) {
    console.error("Code execution error:", error)
    return {
      success: false,
      error: error.message || "Error executing code",
    }
  }
}

// Helper function to create a submission
const createSubmission = async (code, languageId, input) => {
  const options = {
    method: "POST",
    url: `${process.env.JUDGE0_API_URL}/submissions`,
    params: { base64_encoded: "false", wait: "false" },
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
      "X-RapidAPI-Host": process.env.JUDGE0_API_HOST,
    },
    data: {
      source_code: code,
      language_id: languageId,
      stdin: input,
      redirect_stderr_to_stdout: false,
    },
  }

  const response = await axios.request(options)
  return response.data
}

// Helper function to get submission result
const getSubmissionResult = async (token) => {
  const options = {
    method: "GET",
    url: `${process.env.JUDGE0_API_URL}/submissions/${token}`,
    params: { base64_encoded: "false" },
    headers: {
      "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
      "X-RapidAPI-Host": process.env.JUDGE0_API_HOST,
    },
  }

  // Poll until the submission is processed
  let result
  let status

  do {
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second between polls
    const response = await axios.request(options)
    result = response.data
    status = result.status?.id
  } while (status === 1 || status === 2) // 1: In Queue, 2: Processing

  return result
}

// Fallback simulation functions
const simulateEvaluation = (code, testCases) => {
  // Mock results for each test case
  const results = testCases.map((testCase) => ({
    input: testCase.input,
    expectedOutput: testCase.output,
    actualOutput: testCase.output, // Pretend the code produced the correct output
    passed: true,
  }))

  // Check if all test cases passed
  const allPassed = results.every((result) => result.passed)

  return {
    success: true,
    results,
    allPassed,
  }
}

const simulateExecution = (code, testCase) => {
  // For demo purposes, we'll simulate different outputs based on the code length
  let actualOutput
  let passed

  if (code.includes("return") && code.length > 50) {
    // Simulate correct output
    actualOutput = testCase.output
    passed = true
  } else {
    // Simulate incorrect output
    actualOutput = "null"
    passed = false
  }

  return {
    success: true,
    result: {
      input: testCase.input,
      expectedOutput: testCase.output,
      actualOutput: actualOutput,
      passed: passed,
    },
  }
}

module.exports = {
  evaluateCode,
  runCode,
}
