import { useState, useEffect, useRef } from "react"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { User, Eye, EyeOff, Download, Save, Award, Clock, CheckCircle, XCircle, Camera } from "lucide-react"
import { toast } from "react-toastify"
import api from "../utils/api"
import jsPDF from "jspdf"
import "jspdf-autotable"

const ProfilePage = () => {
  const { currentUser, updateProfile, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    profilePicture: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [userStats, setUserStats] = useState({
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    winRate: 0,
    totalProblemsSolved: 0,
    easyProblemsSolved: 0,
    mediumProblemsSolved: 0,
    hardProblemsSolved: 0,
    currentStreak: 0,
    longestStreak: 0,
    trophies: 0,
    trophyTier: { name: "", color: "", icon: "" },
    acceptanceRate: 0,
  })
  const [matchHistory, setMatchHistory] = useState([])
  const [usernameAvailable, setUsernameAvailable] = useState(true)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameChanged, setUsernameChanged] = useState(false)
  const fileInputRef = useRef(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      try {
        // Fetch user profile
        const profileResponse = await api.get("/user/profile")
        if (profileResponse.data && profileResponse.data.success) {
          const user = profileResponse.data.user
          setProfileData({
            username: user.username || "",
            email: user.email || "",
            profilePicture: user.profilePicture || "",
          })

          // Set preview image if profile picture exists
          if (user.profilePicture) {
            setPreviewImage(user.profilePicture)
          }

          // Set user stats
          setUserStats({
            matchesPlayed: user.matchesPlayed || 0,
            matchesWon: user.matchesWon || 0,
            matchesLost: user.matchesLost || 0,
            winRate: user.winRate || 0,
            totalProblemsSolved: user.totalProblemsSolved || 0,
            easyProblemsSolved: user.statistics?.easyProblemsSolved || 0,
            mediumProblemsSolved: user.statistics?.mediumProblemsSolved || 0,
            hardProblemsSolved: user.statistics?.hardProblemsSolved || 0,
            currentStreak: user.statistics?.currentStreak || 0,
            longestStreak: user.statistics?.longestStreak || 0,
            trophies: user.trophies || 0,
            trophyTier: user.trophyTier || { name: "Beginner", color: "#A0A0A0", icon: "🔰" },
            acceptanceRate: user.acceptanceRate || 0,
          })
        }

        // Fetch match history
        const historyResponse = await api.get("/match/user/history")
        if (historyResponse.data && historyResponse.data.success) {
          setMatchHistory(historyResponse.data.matches || [])
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast.error("Failed to load profile data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Check username availability with debounce
  useEffect(() => {
    if (!usernameChanged || profileData.username === currentUser?.username) {
      setUsernameAvailable(true)
      return
    }

    const checkUsername = async () => {
      if (profileData.username.length < 3) {
        setUsernameAvailable(false)
        return
      }

      setIsCheckingUsername(true)
      try {
        const response = await api.get(`/auth/check-username?username=${profileData.username}`)
        setUsernameAvailable(response.data.available)
      } catch (error) {
        console.error("Error checking username:", error)
        setUsernameAvailable(false)
      } finally {
        setIsCheckingUsername(false)
      }
    }

    const timer = setTimeout(checkUsername, 500)
    return () => clearTimeout(timer)
  }, [profileData.username, usernameChanged, currentUser?.username])

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault()

    if (!usernameAvailable) {
      toast.error("Please choose a different username")
      return
    }

    setIsSaving(true)

    try {
      // Create form data for multipart/form-data
      const formData = new FormData()
      formData.append("username", profileData.username)
      // Only append image if a new one was selected
      if (imageFile) {
        formData.append("profilePicture", imageFile,imageFile.name)
      }

      const response = await api.put("/user/profile", formData, {
        headers: {
          // "Content-Type": "multipart/form-data",
        },
      })

      if (response.data && response.data.success) {
        toast.success("Profile updated successfully")
        // Update auth context
        updateProfile(response.data.user)
        // Reset state
        setUsernameChanged(false)
        setImageFile(null)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    setIsSaving(true)

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast.success("Password changed successfully")
    } catch (error) {
      console.error("Password change error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, or GIF)")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewImage(reader.result)
    }
    reader.readAsDataURL(file)

    // Store file for upload
    setImageFile(file)
  }

  // Generate PDF report
  const generatePDF = async () => {
    setIsGeneratingPDF(true)

    try {
        autoTable(jsPDF)
      // Create new PDF document
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(20)
      doc.setTextColor(128, 0, 128) // Purple
      doc.text("CodeClash Profile Report", 105, 15, { align: "center" })

      // Add user info
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text(`User: ${profileData.username}`, 20, 30)
      doc.setFontSize(12)
      doc.text(`Trophy Tier: ${userStats.trophyTier.name}`, 20, 40)
      doc.text(`Trophies: ${userStats.trophies}`, 20, 50)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 60)

      // Add statistics table
      doc.setFontSize(14)
      doc.text("Performance Statistics", 105, 75, { align: "center" })

      const statsData = [
        ["Matches Played", userStats.matchesPlayed.toString()],
        ["Matches Won", userStats.matchesWon.toString()],
        ["Win Rate", `${userStats.winRate}%`],
        ["Total Problems Solved", userStats.totalProblemsSolved.toString()],
        ["Easy Problems", userStats.easyProblemsSolved.toString()],
        ["Medium Problems", userStats.mediumProblemsSolved.toString()],
        ["Hard Problems", userStats.hardProblemsSolved.toString()],
        ["Current Streak", userStats.currentStreak.toString()],
        ["Longest Streak", userStats.longestStreak.toString()],
        ["Acceptance Rate", `${userStats.acceptanceRate}%`],
      ]

      doc.autoTable({
        startY: 80,
        head: [["Metric", "Value"]],
        body: statsData,
        theme: "grid",
        headStyles: { fillColor: [128, 0, 128] },
      })

      // Add match history
      if (matchHistory.length > 0) {
        doc.addPage()
        doc.setFontSize(14)
        doc.text("Recent Match History", 105, 15, { align: "center" })

        const matchData = matchHistory
          .slice(0, 10)
          .map((match, index) => [
            (index + 1).toString(),
            match.opponent?.username || "Unknown",
            match.problem?.title || "Unknown",
            match.result === "win" ? "Victory" : match.result === "loss" ? "Defeat" : "Draw",
            new Date(match.date).toLocaleDateString(),
          ])

        doc.autoTable({
          startY: 20,
          head: [["#", "Opponent", "Problem", "Result", "Date"]],
          body: matchData,
          theme: "grid",
          headStyles: { fillColor: [128, 0, 128] },
        })
      }

      // Save the PDF
      doc.save(`CodeClash_${profileData.username}_Report.pdf`)
      toast.success("Report generated successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate report")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: "No password", color: "bg-gray-300" }

    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    const strengthMap = [
      { text: "Very weak", color: "bg-red-500" },
      { text: "Weak", color: "bg-orange-500" },
      { text: "Medium", color: "bg-yellow-500" },
      { text: "Strong", color: "bg-green-500" },
      { text: "Very strong", color: "bg-green-600" },
    ]

    return {
      strength,
      ...strengthMap[strength],
    }
  }

  const passwordStrength = getPasswordStrength(passwordData.newPassword)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-gray-800 border-b md:border-b-0 md:border-r border-gray-700">
              <nav className="p-4">
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => setActiveTab("profile")}
                      className={`w-full flex items-center px-4 py-3 rounded-md ${
                        activeTab === "profile" ? "bg-purple-600" : "hover:bg-gray-700"
                      }`}
                    >
                      <User className="h-5 w-5 mr-3" />
                      Profile
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("stats")}
                      className={`w-full flex items-center px-4 py-3 rounded-md ${
                        activeTab === "stats" ? "bg-purple-600" : "hover:bg-gray-700"
                      }`}
                    >
                      <Award className="h-5 w-5 mr-3" />
                      Statistics
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("password")}
                      className={`w-full flex items-center px-4 py-3 rounded-md ${
                        activeTab === "password" ? "bg-purple-600" : "hover:bg-gray-700"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-5 h-5 mr-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 10.5V6.75a3 3 0 00-3-3H7.5a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5m-3 3h-3.75a.75.75 0 01-.75-.75V12h4.5m-4.5 0H12m-1.5 0h-1.5m1.5 0H9"
                        />
                      </svg>
                      Password
                    </button>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Content */}
            <div className="w-full p-8">
              {activeTab === "profile" && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>

                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 border-2 border-purple-500">
                          {profileData.profilePicture || previewImage ? (
                            <img
                              src={previewImage || profileData.profilePicture || "/placeholder.svg"}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-700">
                              <User className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 rounded-full p-2 shadow-lg transition-colors"
                        >
                          <Camera className="h-5 w-5" />
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <p className="text-sm text-gray-400 mt-2">Click to upload a new profile picture</p>
                    </div>

                    {/* Username */}
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                        Username
                      </label>
                      <div className="relative">
                        <input
                          id="username"
                          name="username"
                          type="text"
                          value={profileData.username}
                          onChange={(e) => {
                            setProfileData({ ...profileData, username: e.target.value })
                            setUsernameChanged(e.target.value !== currentUser?.username)
                          }}
                          className={`w-full px-4 py-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            usernameChanged
                              ? usernameAvailable
                                ? "border-green-500"
                                : "border-red-500"
                              : "border-gray-600"
                          }`}
                        />
                        {usernameChanged && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {isCheckingUsername ? (
                              <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : usernameAvailable ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                      {usernameChanged && !usernameAvailable && !isCheckingUsername && (
                        <p className="mt-1 text-sm text-red-500">
                          {profileData.username.length < 3
                            ? "Username must be at least 3 characters"
                            : "This username is already taken"}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 opacity-75"
                      />
                      <p className="mt-1 text-xs text-gray-500">Contact support to change your email address</p>
                    </div>

                    {/* Trophy Tier */}
                    <div className="bg-gray-700 rounded-lg p-4 flex items-center">
                      <div className="mr-4 text-4xl">{userStats.trophyTier.icon}</div>
                      <div>
                        <h3 className="font-bold" style={{ color: userStats.trophyTier.color }}>
                          {userStats.trophyTier.name}
                        </h3>
                        <p className="text-sm text-gray-400">{userStats.trophies} trophies</p>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div>
                      <button
                        type="submit"
                        disabled={isSaving || (usernameChanged && !usernameAvailable)}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "stats" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Statistics & Records</h2>
                    <button
                      onClick={generatePDF}
                      disabled={isGeneratingPDF}
                      className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {isGeneratingPDF ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download Report
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Matches Played</div>
                      <div className="text-2xl font-bold">{userStats.matchesPlayed}</div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Matches Won</div>
                      <div className="text-2xl font-bold">{userStats.matchesWon}</div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Win Rate</div>
                      <div className="text-2xl font-bold">{userStats.winRate}%</div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Problems Solved</div>
                      <div className="text-2xl font-bold">{userStats.totalProblemsSolved}</div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Current Streak</div>
                      <div className="text-2xl font-bold">{userStats.currentStreak} days</div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Longest Streak</div>
                      <div className="text-2xl font-bold">{userStats.longestStreak} days</div>
                    </div>
                  </div>

                  {/* Problem Difficulty Breakdown */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Problem Difficulty Breakdown</h3>
                    <div className="bg-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span>Easy</span>
                        </div>
                        <span>{userStats.easyProblemsSolved}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2.5 mb-6">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{
                            width: `${
                              userStats.totalProblemsSolved > 0
                                ? (userStats.easyProblemsSolved / userStats.totalProblemsSolved) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                          <span>Medium</span>
                        </div>
                        <span>{userStats.mediumProblemsSolved}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2.5 mb-6">
                        <div
                          className="bg-yellow-500 h-2.5 rounded-full"
                          style={{
                            width: `${
                              userStats.totalProblemsSolved > 0
                                ? (userStats.mediumProblemsSolved / userStats.totalProblemsSolved) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                          <span>Hard</span>
                        </div>
                        <span>{userStats.hardProblemsSolved}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2.5">
                        <div
                          className="bg-red-500 h-2.5 rounded-full"
                          style={{
                            width: `${
                              userStats.totalProblemsSolved > 0
                                ? (userStats.hardProblemsSolved / userStats.totalProblemsSolved) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Matches */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Recent Matches</h3>
                    {matchHistory.length > 0 ? (
                      <div className="bg-gray-700 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-600">
                          <thead className="bg-gray-800">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                              >
                                Opponent
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                              >
                                Problem
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                              >
                                Result
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                              >
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-600">
                            {matchHistory.slice(0, 5).map((match, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {match.opponent?.username || "Unknown"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {match.problem?.title || "Unknown"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      match.result === "win"
                                        ? "bg-green-900 text-green-300"
                                        : match.result === "loss"
                                          ? "bg-red-900 text-red-300"
                                          : "bg-gray-900 text-gray-300"
                                    }`}
                                  >
                                    {match.result === "win" ? "Victory" : match.result === "loss" ? "Defeat" : "Draw"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                  {new Date(match.date).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-gray-700 rounded-lg p-8 text-center">
                        <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">No match history available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "password" && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Change Password</h2>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {/* Password strength indicator */}
                      {passwordData.newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs text-gray-400">Password strength:</div>
                            <div
                              className="text-xs font-medium"
                              style={{ color: passwordStrength.strength >= 3 ? "#10B981" : "#F59E0B" }}
                            >
                              {passwordStrength.text}
                            </div>
                          </div>
                          <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${passwordStrength.color}`}
                              style={{ width: `${(passwordStrength.strength + 1) * 20}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className={`w-full px-4 py-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          passwordData.newPassword && passwordData.confirmPassword
                            ? passwordData.newPassword === passwordData.confirmPassword
                              ? "border-green-500"
                              : "border-red-500"
                            : "border-gray-600"
                        }`}
                        required
                      />
                      {passwordData.newPassword &&
                        passwordData.confirmPassword &&
                        passwordData.newPassword !== passwordData.confirmPassword && (
                          <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
                        )}
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isSaving || passwordData.newPassword !== passwordData.confirmPassword}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Change Password"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default ProfilePage
