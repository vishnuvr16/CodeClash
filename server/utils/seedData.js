const mongoose = require("mongoose")
const User = require("../models/User")
const Problem = require("../models/Problem")
const dotenv = require("dotenv")
const bcrypt = require("bcryptjs")

// Load environment variables
dotenv.config()

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/peerprep-duel", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected for seeding"))
  .catch((err) => console.error("MongoDB connection error:", err))

const seedProblems = async () => {
  try {
    // Clear existing problems
    await Problem.deleteMany({})

    const problems = [
      {
        title: "Two Sum",
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        difficulty: "Easy",
        tags: ["Array", "Hash Table"],
        examples: [
          {
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
          },
          {
            input: "nums = [3,2,4], target = 6",
            output: "[1,2]",
            explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
          },
        ],
        constraints: `2 <= nums.length <= 10^4
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9
Only one valid answer exists.`,
        hints: [
          "A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Again, it's best to try out brute force solutions for just for completeness. It is from these brute force solutions that you can come up with optimizations.",
          "So, if we fix one of the numbers, say x, we have to scan the entire array to find the next number y which is value - x where value is the input parameter. Can we change our array somehow so that this search becomes faster?",
          "The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?",
        ],
        functionSignatures: [
          {
            language: "javascript",
            functionName: "twoSum",
            parameters: [
              { name: "nums", type: "number[]", description: "Array of integers" },
              { name: "target", type: "number", description: "Target sum" },
            ],
            returnType: "number[]",
            template: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your solution here
    // Example: console.log("Debug:", nums, target);
    
    return []; // Replace with your solution
}`,
          },
          {
            language: "python",
            functionName: "twoSum",
            parameters: [
              { name: "nums", type: "List[int]", description: "Array of integers" },
              { name: "target", type: "int", description: "Target sum" },
            ],
            returnType: "List[int]",
            template: `def twoSum(nums, target):
    """
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    """
    # Write your solution here
    # Example: print("Debug:", nums, target)
    
    return []  # Replace with your solution`,
          },
          {
            language: "java",
            functionName: "twoSum",
            parameters: [
              { name: "nums", type: "int[]", description: "Array of integers" },
              { name: "target", type: "int", description: "Target sum" },
            ],
            returnType: "int[]",
            template: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        // Example: System.out.println("Debug: " + Arrays.toString(nums) + ", " + target);
        
        return new int[]{}; // Replace with your solution
    }
}`,
          },
          {
            language: "cpp",
            functionName: "twoSum",
            parameters: [
              { name: "nums", type: "vector<int>&", description: "Array of integers" },
              { name: "target", type: "int", description: "Target sum" },
            ],
            returnType: "vector<int>",
            template: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        // Example: cout << "Debug: nums size = " << nums.size() << ", target = " << target << endl;
        
        return {}; // Replace with your solution
    }
};`,
          },
        ],
        testCases: [
          { input: [[2, 7, 11, 15], 9], output: [0, 1] },
          { input: [[3, 2, 4], 6], output: [1, 2] },
          { input: [[3, 3], 6], output: [0, 1] },
          { input: [[1, 2, 3, 4, 5], 9], output: [3, 4] },
          { input: [[-1, -2, -3, -4, -5], -8], output: [2, 4], isHidden: true },
        ],
      },
      {
        title: "Add Two Numbers",
        description: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.`,
        difficulty: "Medium",
        tags: ["Linked List", "Math", "Recursion"],
        examples: [
          {
            input: "l1 = [2,4,3], l2 = [5,6,4]",
            output: "[7,0,8]",
            explanation: "342 + 465 = 807.",
          },
          {
            input: "l1 = [0], l2 = [0]",
            output: "[0]",
            explanation: "0 + 0 = 0.",
          },
        ],
        constraints: `The number of nodes in each linked list is in the range [1, 100].
0 <= Node.val <= 9
It is guaranteed that the list represents a number that does not have leading zeros.`,
        functionSignatures: [
          {
            language: "javascript",
            functionName: "addTwoNumbers",
            parameters: [
              { name: "l1", type: "ListNode", description: "First linked list" },
              { name: "l2", type: "ListNode", description: "Second linked list" },
            ],
            returnType: "ListNode",
            template: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
function addTwoNumbers(l1, l2) {
    // Write your solution here
    // Example: console.log("Processing linked lists");
    
    return null; // Replace with your solution
}`,
          },
          {
            language: "python",
            functionName: "addTwoNumbers",
            parameters: [
              { name: "l1", type: "ListNode", description: "First linked list" },
              { name: "l2", type: "ListNode", description: "Second linked list" },
            ],
            returnType: "ListNode",
            template: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

def addTwoNumbers(l1, l2):
    """
    :type l1: ListNode
    :type l2: ListNode
    :rtype: ListNode
    """
    # Write your solution here
    # Example: print("Processing linked lists")
    
    return None  # Replace with your solution`,
          },
          {
            language: "java",
            functionName: "addTwoNumbers",
            parameters: [
              { name: "l1", type: "ListNode", description: "First linked list" },
              { name: "l2", type: "ListNode", description: "Second linked list" },
            ],
            returnType: "ListNode",
            template: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        // Write your solution here
        // Example: System.out.println("Processing linked lists");
        
        return null; // Replace with your solution
    }
}`,
          },
        ],
        testCases: [
          {
            input: [
              [2, 4, 3],
              [5, 6, 4],
            ],
            output: [7, 0, 8],
          },
          { input: [[0], [0]], output: [0] },
          {
            input: [
              [9, 9, 9, 9, 9, 9, 9],
              [9, 9, 9, 9],
            ],
            output: [8, 9, 9, 9, 0, 0, 0, 1],
          },
        ],
      },
      {
        title: "Longest Substring Without Repeating Characters",
        description: `Given a string s, find the length of the longest substring without repeating characters.`,
        difficulty: "Medium",
        tags: ["Hash Table", "String", "Sliding Window"],
        examples: [
          {
            input: 's = "abcabcbb"',
            output: "3",
            explanation: 'The answer is "abc", with the length of 3.',
          },
          {
            input: 's = "bbbbb"',
            output: "1",
            explanation: 'The answer is "b", with the length of 1.',
          },
          {
            input: 's = "pwwkew"',
            output: "3",
            explanation: 'The answer is "wke", with the length of 3.',
          },
        ],
        constraints: `0 <= s.length <= 5 * 10^4
s consists of English letters, digits, symbols and spaces.`,
        functionSignatures: [
          {
            language: "javascript",
            functionName: "lengthOfLongestSubstring",
            parameters: [{ name: "s", type: "string", description: "Input string" }],
            returnType: "number",
            template: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
    // Write your solution here
    // Example: console.log("Input string:", s);
    
    return 0; // Replace with your solution
}`,
          },
          {
            language: "python",
            functionName: "lengthOfLongestSubstring",
            parameters: [{ name: "s", type: "str", description: "Input string" }],
            returnType: "int",
            template: `def lengthOfLongestSubstring(s):
    """
    :type s: str
    :rtype: int
    """
    # Write your solution here
    # Example: print("Input string:", s)
    
    return 0  # Replace with your solution`,
          },
          {
            language: "java",
            functionName: "lengthOfLongestSubstring",
            parameters: [{ name: "s", type: "String", description: "Input string" }],
            returnType: "int",
            template: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Write your solution here
        // Example: System.out.println("Input string: " + s);
        
        return 0; // Replace with your solution
    }
}`,
          },
        ],
        testCases: [
          { input: ["abcabcbb"], output: 3 },
          { input: ["bbbbb"], output: 1 },
          { input: ["pwwkew"], output: 3 },
          { input: [""], output: 0 },
          { input: [" "], output: 1 },
          { input: ["au"], output: 2, isHidden: true },
        ],
      },
      {
        title: "Median of Two Sorted Arrays",
        description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).`,
        difficulty: "Hard",
        tags: ["Array", "Binary Search", "Divide and Conquer"],
        examples: [
          {
            input: "nums1 = [1,3], nums2 = [2]",
            output: "2.00000",
            explanation: "merged array = [1,2,3] and median is 2.",
          },
          {
            input: "nums1 = [1,2], nums2 = [3,4]",
            output: "2.50000",
            explanation: "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.",
          },
        ],
        constraints: `nums1.length == m
nums2.length == n
0 <= m <= 1000
0 <= n <= 1000
1 <= m + n <= 2000
-10^6 <= nums1[i], nums2[i] <= 10^6`,
        functionSignatures: [
          {
            language: "javascript",
            functionName: "findMedianSortedArrays",
            parameters: [
              { name: "nums1", type: "number[]", description: "First sorted array" },
              { name: "nums2", type: "number[]", description: "Second sorted array" },
            ],
            returnType: "number",
            template: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
function findMedianSortedArrays(nums1, nums2) {
    // Write your solution here
    // Example: console.log("Arrays:", nums1, nums2);
    
    return 0.0; // Replace with your solution
}`,
          },
          {
            language: "python",
            functionName: "findMedianSortedArrays",
            parameters: [
              { name: "nums1", type: "List[int]", description: "First sorted array" },
              { name: "nums2", type: "List[int]", description: "Second sorted array" },
            ],
            returnType: "float",
            template: `def findMedianSortedArrays(nums1, nums2):
    """
    :type nums1: List[int]
    :type nums2: List[int]
    :rtype: float
    """
    # Write your solution here
    # Example: print("Arrays:", nums1, nums2)
    
    return 0.0  # Replace with your solution`,
          },
          {
            language: "java",
            functionName: "findMedianSortedArrays",
            parameters: [
              { name: "nums1", type: "int[]", description: "First sorted array" },
              { name: "nums2", type: "int[]", description: "Second sorted array" },
            ],
            returnType: "double",
            template: `class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        // Write your solution here
        // Example: System.out.println("Arrays: " + Arrays.toString(nums1) + ", " + Arrays.toString(nums2));
        
        return 0.0; // Replace with your solution
    }
}`,
          },
        ],
        testCases: [
          { input: [[1, 3], [2]], output: 2.0 },
          {
            input: [
              [1, 2],
              [3, 4],
            ],
            output: 2.5,
          },
          {
            input: [
              [0, 0],
              [0, 0],
            ],
            output: 0.0,
          },
          { input: [[], [1]], output: 1.0 },
          { input: [[2], []], output: 2.0 },
        ],
      },
      {
        title: "Valid Parentheses",
        description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
        difficulty: "Easy",
        tags: ["String", "Stack"],
        examples: [
          {
            input: 's = "()"',
            output: "true",
          },
          {
            input: 's = "()[]{}"',
            output: "true",
          },
          {
            input: 's = "(]"',
            output: "false",
          },
        ],
        constraints: `1 <= s.length <= 10^4
s consists of parentheses only '()[]{}'.`,
        functionSignatures: [
          {
            language: "javascript",
            functionName: "isValid",
            parameters: [{ name: "s", type: "string", description: "String containing parentheses" }],
            returnType: "boolean",
            template: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your solution here
    // Example: console.log("Input:", s);
    
    return false; // Replace with your solution
}`,
          },
          {
            language: "python",
            functionName: "isValid",
            parameters: [{ name: "s", type: "str", description: "String containing parentheses" }],
            returnType: "bool",
            template: `def isValid(s):
    """
    :type s: str
    :rtype: bool
    """
    # Write your solution here
    # Example: print("Input:", s)
    
    return False  # Replace with your solution`,
          },
          {
            language: "java",
            functionName: "isValid",
            parameters: [{ name: "s", type: "String", description: "String containing parentheses" }],
            returnType: "boolean",
            template: `class Solution {
    public boolean isValid(String s) {
        // Write your solution here
        // Example: System.out.println("Input: " + s);
        
        return false; // Replace with your solution
    }
}`,
          },
        ],
        testCases: [
          { input: ["()"], output: true },
          { input: ["()[]{}"], output: true },
          { input: ["(]"], output: false },
          { input: ["([)]"], output: false },
          { input: ["{[]}"], output: true },
          { input: ["(("], output: false, isHidden: true },
        ],
      },
    ]

    // Insert problems
    await Problem.insertMany(problems)
    console.log("✅ Problems seeded successfully")
  } catch (error) {
    console.error("❌ Error seeding problems:", error)
  }
}

const seedUsers = async () => {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({ email: "admin@peerprep.com" })

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10)

      const adminUser = new User({
        username: "admin",
        email: "admin@peerprep.com",
        password: hashedPassword,
        trophies: 1000,
        statistics: {
          totalSubmissions: 50,
          acceptedSubmissions: 35,
          easyProblemsSolved: 15,
          mediumProblemsSolved: 15,
          hardProblemsSolved: 5,
          currentStreak: 7,
          longestStreak: 12,
          totalTrophiesEarned: 900,
          totalTrophiesLost: 0,
        },
      })

      await adminUser.save()
      console.log("✅ Admin user created successfully")
    }
  } catch (error) {
    console.error("❌ Error seeding users:", error)
  }
}

const seedData = async () => {
  try {
    await seedProblems()
    await seedUsers()
    console.log("🎉 All seed data created successfully!")
  } catch (error) {
    console.error("❌ Error seeding data:", error)
  }
}

module.exports = { seedData, seedProblems, seedUsers }
