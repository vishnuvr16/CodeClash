const Problem = require("../models/Problem")
const User = require("../models/User")

const seedProblems = async () => {
  try {
    // Clear existing problems
    // console.log("Cleared existing problems")

    const problems = [
      {
        title: "Sum of Two Numbers",
        description: `Given two integers, calculate their sum.

Input Format:
A single line containing two space-separated integers a and b.

Output Format:
Print the sum of a and b.`,
        difficulty: "Easy",
        tags: ["math", "basic"],
        examples: [
          {
            input: "5 3",
            output: "8",
            explanation: "5 + 3 = 8",
          },
          {
            input: "10 -2",
            output: "8",
            explanation: "10 + (-2) = 8",
          },
        ],
        constraints: "-10^9 ≤ a, b ≤ 10^9",
        testCases: [
          { input: "5 3", output: "8" },
          { input: "10 -2", output: "8" },
          { input: "0 0", output: "0" },
          { input: "1000000 2000000", output: "3000000" },
          { input: "-5 -3", output: "-8" },
        ],
      },
      {
        title: "Array Sum",
        description: `Given an array of integers, calculate the sum of all elements.

Input Format:
First line contains an integer n (size of array).
Second line contains n space-separated integers.

Output Format:
Print the sum of all array elements.`,
        difficulty: "Easy",
        tags: ["array", "math"],
        examples: [
          {
            input: "3\n1 2 3",
            output: "6",
            explanation: "1 + 2 + 3 = 6",
          },
          {
            input: "4\n-1 2 -3 4",
            output: "2",
            explanation: "-1 + 2 + (-3) + 4 = 2",
          },
        ],
        constraints: "1 ≤ n ≤ 10^5\n-10^9 ≤ array elements ≤ 10^9",
        testCases: [
          { input: "3\n1 2 3", output: "6" },
          { input: "4\n-1 2 -3 4", output: "2" },
          { input: "1\n42", output: "42" },
          { input: "5\n0 0 0 0 0", output: "0" },
          { input: "2\n1000000 -1000000", output: "0" },
        ],
      },
      {
        title: "Maximum Element",
        description: `Find the maximum element in an array of integers.

Input Format:
First line contains an integer n (size of array).
Second line contains n space-separated integers.

Output Format:
Print the maximum element in the array.`,
        difficulty: "Easy",
        tags: ["array", "search"],
        examples: [
          {
            input: "5\n3 1 4 1 5",
            output: "5",
            explanation: "The maximum element is 5",
          },
          {
            input: "3\n-1 -5 -2",
            output: "-1",
            explanation: "Among negative numbers, -1 is the maximum",
          },
        ],
        constraints: "1 ≤ n ≤ 10^5\n-10^9 ≤ array elements ≤ 10^9",
        testCases: [
          { input: "5\n3 1 4 1 5", output: "5" },
          { input: "3\n-1 -5 -2", output: "-1" },
          { input: "1\n42", output: "42" },
          { input: "4\n100 200 50 150", output: "200" },
          { input: "6\n-10 -20 -5 -15 -25 -1", output: "-1" },
        ],
      },
      {
        title: "Reverse String",
        description: `Given a string, reverse it and print the result.

Input Format:
A single line containing a string.

Output Format:
Print the reversed string.`,
        difficulty: "Easy",
        tags: ["string", "basic"],
        examples: [
          {
            input: "hello",
            output: "olleh",
            explanation: "Reverse of 'hello' is 'olleh'",
          },
          {
            input: "world",
            output: "dlrow",
            explanation: "Reverse of 'world' is 'dlrow'",
          },
        ],
        constraints: "1 ≤ string length ≤ 10^5",
        testCases: [
          { input: "hello", output: "olleh" },
          { input: "world", output: "dlrow" },
          { input: "a", output: "a" },
          { input: "racecar", output: "racecar" },
          { input: "programming", output: "gnimmargorprogramming" },
        ],
      },
      {
        title: "Count Vowels",
        description: `Count the number of vowels (a, e, i, o, u) in a given string. Case insensitive.

Input Format:
A single line containing a string.

Output Format:
Print the count of vowels.`,
        difficulty: "Medium",
        tags: ["string", "counting"],
        examples: [
          {
            input: "hello",
            output: "2",
            explanation: "Vowels are 'e' and 'o', so count is 2",
          },
          {
            input: "Programming",
            output: "3",
            explanation: "Vowels are 'o', 'a', 'i', so count is 3",
          },
        ],
        constraints: "1 ≤ string length ≤ 10^5",
        testCases: [
          { input: "hello", output: "2" },
          { input: "Programming", output: "3" },
          { input: "xyz", output: "0" },
          { input: "aeiou", output: "5" },
          { input: "HELLO WORLD", output: "3" },
        ],
      },
      {
        title: "Fibonacci Number",
        description: `Calculate the nth Fibonacci number. The Fibonacci sequence starts with 0, 1, and each subsequent number is the sum of the previous two.

Input Format:
A single integer n.

Output Format:
Print the nth Fibonacci number.`,
        difficulty: "Medium",
        tags: ["math", "recursion", "dynamic-programming"],
        examples: [
          {
            input: "5",
            output: "5",
            explanation: "F(5) = F(4) + F(3) = 3 + 2 = 5",
          },
          {
            input: "10",
            output: "55",
            explanation: "The 10th Fibonacci number is 55",
          },
        ],
        constraints: "0 ≤ n ≤ 50",
        testCases: [
          { input: "0", output: "0" },
          { input: "1", output: "1" },
          { input: "5", output: "5" },
          { input: "10", output: "55" },
          { input: "15", output: "610" },
        ],
      },
      {
        title: "Prime Check",
        description: `Check if a given number is prime. A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.

Input Format:
A single integer n.

Output Format:
Print "YES" if the number is prime, "NO" otherwise.`,
        difficulty: "Medium",
        tags: ["math", "prime"],
        examples: [
          {
            input: "7",
            output: "YES",
            explanation: "7 is a prime number",
          },
          {
            input: "8",
            output: "NO",
            explanation: "8 is not prime (divisible by 2 and 4)",
          },
        ],
        constraints: "1 ≤ n ≤ 10^6",
        testCases: [
          { input: "2", output: "YES" },
          { input: "7", output: "YES" },
          { input: "8", output: "NO" },
          { input: "97", output: "YES" },
          { input: "100", output: "NO" },
        ],
      },
      {
        title: "Binary Search",
        description: `Given a sorted array and a target value, find the index of the target value. If not found, return -1.

Input Format:
First line contains n (array size) and target.
Second line contains n sorted integers.

Output Format:
Print the index of target (0-based) or -1 if not found.`,
        difficulty: "Hard",
        tags: ["array", "binary-search", "search"],
        examples: [
          {
            input: "5 3\n1 2 3 4 5",
            output: "2",
            explanation: "3 is at index 2",
          },
          {
            input: "4 6\n1 3 5 7",
            output: "-1",
            explanation: "6 is not in the array",
          },
        ],
        constraints: "1 ≤ n ≤ 10^5\n-10^9 ≤ array elements, target ≤ 10^9",
        testCases: [
          { input: "5 3\n1 2 3 4 5", output: "2" },
          { input: "4 6\n1 3 5 7", output: "-1" },
          { input: "1 42\n42", output: "0" },
          { input: "6 1\n1 2 3 4 5 6", output: "0" },
          { input: "3 10\n5 10 15", output: "1" },
        ],
      },
    ]

    // Insert problems
    const insertedProblems = await Problem.insertMany(problems)
    // console.log(`Inserted ${insertedProblems.length} problems`)

    return insertedProblems
  } catch (error) {
    console.error("Error seeding problems:", error)
    throw error
  }
}

const seedUsers = async () => {
  try {
    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ email: "admin@peerprep.com" })
    if (!adminExists) {
      const admin = new User({
        username: "admin",
        email: "admin@peerprep.com",
        password: "admin123",
        trophies: 1000,
        isAdmin: true,
      })
      await admin.save()
      // console.log("Created admin user")
    }

    // console.log("User seeding completed")
  } catch (error) {
    console.error("Error seeding users:", error)
    throw error
  }
}

const seedDatabase = async () => {
  try {
    // console.log("Starting database seeding...")
    await seedProblems()
    await seedUsers()
    // console.log("Database seeding completed successfully!")
  } catch (error) {
    console.error("Database seeding failed:", error)
    process.exit(1)
  }
}

module.exports = {
  seedDatabase,
  seedProblems,
  seedUsers,
}
