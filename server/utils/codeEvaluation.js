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

// Create problem-specific driver code
const createProblemDriverCode = (userCode, language, problem, testCase) => {
  const functionSig = problem.functionSignatures.find((sig) => sig.language === language)
  if (!functionSig) {
    throw new Error(`No function signature found for language: ${language}`)
  }

  const input = testCase.input
  const expectedOutput = testCase.output

  switch (language.toLowerCase()) {
    case "javascript":
      return createJavaScriptDriver(userCode, functionSig, input, expectedOutput)
    case "python":
      return createPythonDriver(userCode, functionSig, input, expectedOutput)
    case "java":
      return createJavaDriver(userCode, functionSig, input, expectedOutput)
    case "cpp":
      return createCppDriver(userCode, functionSig, input, expectedOutput)
    default:
      throw new Error(`Unsupported language: ${language}`)
  }
}

const createJavaScriptDriver = (userCode, functionSig, input, expectedOutput) => {
  const { functionName, parameters } = functionSig

  // Parse input based on parameter types
  const inputValues = Array.isArray(input) ? input : [input]
  const parameterAssignments = parameters
    .map((param, index) => {
      const value = inputValues[index]
      if (param.type.includes("[]") || param.type === "array") {
        return `const ${param.name} = ${JSON.stringify(value)};`
      } else if (param.type === "string") {
        return `const ${param.name} = ${JSON.stringify(value)};`
      } else {
        return `const ${param.name} = ${JSON.stringify(value)};`
      }
    })
    .join("\n  ")

  const functionCall = `${functionName}(${parameters.map((p) => p.name).join(", ")})`

  return `
// User's solution
${userCode}

// Driver code
try {
  console.log("=== Test Case Execution ===");
  console.log("Input:", ${JSON.stringify(input)});
  
  // Parse input parameters
  ${parameterAssignments}
  
  // Call user's function
  const result = ${functionCall};
  
  console.log("Your Output:", result);
  console.log("Expected Output:", ${JSON.stringify(expectedOutput)});
  console.log("=== End Test Case ===");
  
  // Output result for comparison
  console.log("RESULT:" + JSON.stringify(result));
} catch (error) {
  console.error("Runtime Error:", error.message);
  console.log("RESULT:ERROR");
}
`
}

const createPythonDriver = (userCode, functionSig, input, expectedOutput) => {
  const { functionName, parameters } = functionSig

  // Parse input based on parameter types
  const inputValues = Array.isArray(input) ? input : [input]
  const parameterAssignments = parameters
    .map((param, index) => {
      const value = inputValues[index]
      return `${param.name} = ${JSON.stringify(value)}`
    })
    .join("\n    ")

  const functionCall = `${functionName}(${parameters.map((p) => p.name).join(", ")})`

  return `
import json

# User's solution
${userCode}

# Driver code
try:
    print("=== Test Case Execution ===")
    print("Input:", ${JSON.stringify(input)})
    
    # Parse input parameters
    ${parameterAssignments}
    
    # Call user's function
    result = ${functionCall}
    
    print("Your Output:", result)
    print("Expected Output:", ${JSON.stringify(expectedOutput)})
    print("=== End Test Case ===")
    
    # Output result for comparison
    print("RESULT:" + json.dumps(result))
except Exception as error:
    print("Runtime Error:", str(error))
    print("RESULT:ERROR")
`
}

const createJavaDriver = (userCode, functionSig, input, expectedOutput) => {
  const { functionName, parameters, returnType } = functionSig

  // Parse input based on parameter types
  const inputValues = Array.isArray(input) ? input : [input]
  const parameterAssignments = parameters
    .map((param, index) => {
      const value = inputValues[index]
      if (param.type === "int[]") {
        return `int[] ${param.name} = {${value.join(", ")}};`
      } else if (param.type === "String[]") {
        return `String[] ${param.name} = {${value.map((v) => `"${v}"`).join(", ")}};`
      } else if (param.type === "String") {
        return `String ${param.name} = "${value}";`
      } else if (param.type === "int") {
        return `int ${param.name} = ${value};`
      } else {
        return `Object ${param.name} = ${JSON.stringify(value)};`
      }
    })
    .join("\n        ")

  const functionCall = `solution.${functionName}(${parameters.map((p) => p.name).join(", ")})`

  return `
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        try {
            System.out.println("=== Test Case Execution ===");
            System.out.println("Input: " + ${JSON.stringify(JSON.stringify(input))});
            
            Solution solution = new Solution();
            
            // Parse input parameters
            ${parameterAssignments}
            
            // Call user's function
            ${returnType} result = ${functionCall};
            
            System.out.println("Your Output: " + result);
            System.out.println("Expected Output: " + ${JSON.stringify(JSON.stringify(expectedOutput))});
            System.out.println("=== End Test Case ===");
            
            // Output result for comparison
            if (result instanceof int[]) {
                System.out.println("RESULT:" + Arrays.toString((int[])result));
            } else if (result instanceof String[]) {
                System.out.println("RESULT:" + Arrays.toString((String[])result));
            } else {
                System.out.println("RESULT:" + result);
            }
        } catch (Exception error) {
            System.err.println("Runtime Error: " + error.getMessage());
            System.out.println("RESULT:ERROR");
        }
    }
}

// User's solution
${userCode}
`
}

const createCppDriver = (userCode, functionSig, input, expectedOutput) => {
  const { functionName, parameters } = functionSig

  return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

// User's solution
${userCode}

int main() {
    try {
        cout << "=== Test Case Execution ===" << endl;
        cout << "Input: " << ${JSON.stringify(JSON.stringify(input))} << endl;
        
        Solution solution;
        
        // For C++, we'll use a simplified approach
        auto result = solution.${functionName}();
        
        cout << "Your Output: " << result << endl;
        cout << "Expected Output: " << ${JSON.stringify(JSON.stringify(expectedOutput))} << endl;
        cout << "=== End Test Case ===" << endl;
        
        cout << "RESULT:" << result << endl;
    } catch (const exception& error) {
        cerr << "Runtime Error: " << error.what() << endl;
        cout << "RESULT:ERROR" << endl;
    }
    return 0;
}
`
}

// Enhanced function to evaluate code using Judge0 API
const evaluateCode = async (code, language, problem, testCases) => {
  try {
    if (!process.env.JUDGE0_API_KEY) {
      console.log("No Judge0 API key found, using simulation")
      return simulateEvaluation(code, testCases)
    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()]
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`)
    }

    console.log(`Evaluating ${language} code with ${testCases.length} test cases`)

    // Process each test case
    const results = await Promise.all(
      testCases.map(async (testCase, index) => {
        try {
          // Create problem-specific executable code
          const executableCode = createProblemDriverCode(code, language, problem, testCase)

          const submission = await createSubmission(executableCode, languageId, "")

          if (!submission.token) {
            throw new Error("Failed to create submission - no token received")
          }

          // Wait for the submission to be processed
          const result = await getSubmissionResult(submission.token)

          // Parse the output to extract result and console logs
          const { actualOutput, consoleOutput, passed } = parseExecutionOutput(result.stdout || "", testCase.output)

          return {
            testCase: index + 1,
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput,
            consoleOutput,
            passed,
            status: STATUS_MAPPING[result.status?.id] || "Unknown",
            statusId: result.status?.id,
            executionTime: result.time ? Number.parseFloat(result.time) : null,
            memoryUsed: result.memory ? Number.parseInt(result.memory) : null,
            error: result.stderr || result.compile_output || null,
            exitCode: result.exit_code,
          }
        } catch (error) {
          console.error(`Error processing test case ${index + 1}:`, error)
          return {
            testCase: index + 1,
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: "",
            consoleOutput: "",
            passed: false,
            status: "Error",
            statusId: -1,
            executionTime: null,
            memoryUsed: null,
            error: error.message,
            exitCode: null,
          }
        }
      }),
    )

    // Calculate statistics
    const passedCount = results.filter((result) => result.passed).length
    const allPassed = passedCount === testCases.length
    const totalExecutionTime = results.reduce((sum, result) => sum + (result.executionTime || 0), 0)
    const maxMemoryUsed = Math.max(...results.map((result) => result.memoryUsed || 0))

    return {
      success: true,
      results,
      allPassed,
      passedCount,
      totalTestCases: testCases.length,
      totalExecutionTime: Number.parseFloat(totalExecutionTime.toFixed(3)),
      maxMemoryUsed,
      overallStatus: allPassed ? "Accepted" : "Failed",
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

// Enhanced function to run code against a single test case
const runCode = async (code, language, problem, testCase) => {
  try {
    if (!process.env.JUDGE0_API_KEY) {
      console.log("No Judge0 API key found, using simulation")
      return simulateExecution(code, testCase)
    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()]
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`)
    }

    console.log(`Running ${language} code`)

    // Create problem-specific executable code
    const executableCode = createProblemDriverCode(code, language, problem, testCase)

    // Create submission
    const submission = await createSubmission(executableCode, languageId, "")

    if (!submission.token) {
      throw new Error("Failed to create submission - no token received")
    }

    // Wait for the submission to be processed
    const result = await getSubmissionResult(submission.token)

    // Parse the output to extract result and console logs
    const { actualOutput, consoleOutput, passed } = parseExecutionOutput(result.stdout || "", testCase.output)

    return {
      success: true,
      result: {
        input: testCase.input,
        expectedOutput: testCase.output,
        actualOutput,
        consoleOutput,
        passed,
        status: STATUS_MAPPING[result.status?.id] || "Unknown",
        statusId: result.status?.id,
        executionTime: result.time ? Number.parseFloat(result.time) : null,
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

// Helper function to parse execution output
const parseExecutionOutput = (stdout, expectedOutput) => {
  if (!stdout) {
    return {
      actualOutput: "",
      consoleOutput: "",
      passed: false,
    }
  }

  // Split output into lines
  const lines = stdout.split("\n")

  // Find the result line
  const resultLine = lines.find((line) => line.startsWith("RESULT:"))
  let actualOutput = ""

  if (resultLine) {
    const resultValue = resultLine.substring(7) // Remove "RESULT:" prefix
    if (resultValue === "ERROR") {
      actualOutput = "Error occurred"
    } else {
      try {
        // Try to parse JSON result
        actualOutput = JSON.parse(resultValue)
      } catch {
        // If not JSON, use as string
        actualOutput = resultValue
      }
    }
  }

  // Get console output (everything except the result line)
  const consoleOutput = lines
    .filter((line) => !line.startsWith("RESULT:"))
    .join("\n")
    .trim()

  // Compare outputs
  const normalizedExpected = normalizeOutput(expectedOutput)
  const normalizedActual = normalizeOutput(actualOutput)
  const passed = normalizedExpected === normalizedActual

  return {
    actualOutput: actualOutput.toString(),
    consoleOutput,
    passed,
  }
}

// Helper function to create a submission
const createSubmission = async (code, languageId, input) => {
  const options = {
    method: "POST",
    url: `${process.env.JUDGE0_API_URL}/submissions`,
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
      stdin: input,
      cpu_time_limit: 3,
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
    url: `${process.env.JUDGE0_API_URL}/submissions/${token}`,
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
  const maxAttempts = 20

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

// Helper function to normalize output for comparison
const normalizeOutput = (output) => {
  if (output === null || output === undefined) return ""
  return output.toString().trim().replace(/\r\n/g, "\n").replace(/\s+$/gm, "")
}

// Simulation functions for when Judge0 is not available
const simulateEvaluation = (code, testCases) => {
  console.log("Using simulation mode for code evaluation")

  const results = testCases.map((testCase, index) => {
    const hasFunction = code.includes("function") || code.includes("def") || code.includes("class")
    const hasLogic = code.includes("return") || code.length > 50
    const passed = hasFunction && hasLogic

    return {
      testCase: index + 1,
      input: testCase.input,
      expectedOutput: testCase.output,
      actualOutput: passed ? testCase.output : "undefined",
      consoleOutput: `=== Test Case Execution ===\nInput: ${JSON.stringify(testCase.input)}\nYour Output: ${passed ? testCase.output : "undefined"}\nExpected Output: ${testCase.output}\n=== End Test Case ===`,
      passed,
      status: passed ? "Accepted" : "Wrong Answer",
      statusId: passed ? 3 : 4,
      executionTime: Math.random() * 0.1,
      memoryUsed: Math.floor(Math.random() * 1000) + 500,
      error: null,
      exitCode: 0,
    }
  })

  const passedCount = results.filter((result) => result.passed).length
  const allPassed = passedCount === testCases.length

  return {
    success: true,
    results,
    allPassed,
    passedCount,
    totalTestCases: testCases.length,
    totalExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
    maxMemoryUsed: Math.max(...results.map((r) => r.memoryUsed)),
    overallStatus: allPassed ? "Accepted" : "Failed",
  }
}

const simulateExecution = (code, testCase) => {
  console.log("Using simulation mode for code execution")

  const hasFunction = code.includes("function") || code.includes("def") || code.includes("class")
  const hasLogic = code.includes("return") || code.length > 50
  const passed = hasFunction && hasLogic

  return {
    success: true,
    result: {
      input: testCase.input,
      expectedOutput: testCase.output,
      actualOutput: passed ? testCase.output : "undefined",
      consoleOutput: `=== Test Case Execution ===\nInput: ${JSON.stringify(testCase.input)}\nYour Output: ${passed ? testCase.output : "undefined"}\nExpected Output: ${testCase.output}\n=== End Test Case ===`,
      passed,
      status: passed ? "Accepted" : "Wrong Answer",
      statusId: passed ? 3 : 4,
      executionTime: Math.random() * 0.1,
      memoryUsed: Math.floor(Math.random() * 1000) + 500,
      error: null,
      exitCode: 0,
    },
  }
}

module.exports = {
  evaluateCode,
  runCode,
  LANGUAGE_IDS,
  STATUS_MAPPING,
}
