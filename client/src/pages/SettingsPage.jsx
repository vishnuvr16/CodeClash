import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { User, Eye, EyeOff } from "lucide-react"
import { toast } from "react-toastify"

const SettingsPage = () => {
  const { currentUser, updateProfile, changePassword } = useAuth()

  const [activeTab, setActiveTab] = useState("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    matchInvites: true,
    systemAnnouncements: true,
  })
  const [privacySettings, setPrivacySettings] = useState({
    showProfile: true,
    showRating: true,
    showMatchHistory: true,
  })

  // Load user data
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        username: currentUser.username || "",
        email: currentUser.email || "",
      })
    }
  }, [currentUser])

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await updateProfile(profileData)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Profile update error:", error)
    } finally {
      setIsLoading(false)
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

    setIsLoading(true)

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
      setIsLoading(false)
    }
  }

  // Handle notification settings submission
  const handleNotificationSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // In a real app, you would save these settings to the server
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call
      toast.success("Notification settings updated")
    } catch (error) {
      console.error("Notification settings error:", error)
      toast.error("Failed to update notification settings")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle privacy settings submission
  const handlePrivacySubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // In a real app, you would save these settings to the server
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call
      toast.success("Privacy settings updated")
    } catch (error) {
      console.error("Privacy settings error:", error)
      toast.error("Failed to update privacy settings")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

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
                  <li>
                    <button
                      onClick={() => setActiveTab("notifications")}
                      className={`w-full flex items-center px-4 py-3 rounded-md ${
                        activeTab === "notifications" ? "bg-purple-600" : "hover:bg-gray-700"
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
                          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118.665 9.02c.23-.543.66-1.1 1.44-1.67l.436-.252A1.638 1.638 0 0121 2.036v.09a1.639 1.639 0 01-1.07 1.395l-.426.245a1.597 1.597 0 01-1.185.374c-.591 0-1.118-.152-1.587-.429m-5.454 8.01L9.578 7.808M5.706 7.808l-.228.835m-.567 2.664l-.228.835m2.91 4.99l.228-.835M3.987 19.249l.228-.835m3.345-5.72l-.228.835"
                        />
                      </svg>
                      Notifications
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("privacy")}
                      className={`w-full flex items-center px-4 py-3 rounded-md ${
                        activeTab === "privacy" ? "bg-purple-600" : "hover:bg-gray-700"
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
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Privacy
                    </button>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Content */}
            <div className="w-full p-8">
              {activeTab === "profile" && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Profile Settings</h2>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                        Username
                      </label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Update Profile"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "password" && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Password Settings</h2>
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
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Change Password"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Notification Settings</h2>
                  <form onSubmit={handleNotificationSubmit} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label htmlFor="emailNotifications" className="block text-sm font-medium text-gray-300">
                        Email Notifications
                      </label>
                      <input
                        id="emailNotifications"
                        name="emailNotifications"
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            emailNotifications: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="matchInvites" className="block text-sm font-medium text-gray-300">
                        Match Invites
                      </label>
                      <input
                        id="matchInvites"
                        name="matchInvites"
                        type="checkbox"
                        checked={notificationSettings.matchInvites}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            matchInvites: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="systemAnnouncements" className="block text-sm font-medium text-gray-300">
                        System Announcements
                      </label>
                      <input
                        id="systemAnnouncements"
                        name="systemAnnouncements"
                        type="checkbox"
                        checked={notificationSettings.systemAnnouncements}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            systemAnnouncements: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700"
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Update Notifications"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "privacy" && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Privacy Settings</h2>
                  <form onSubmit={handlePrivacySubmit} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label htmlFor="showProfile" className="block text-sm font-medium text-gray-300">
                        Show Profile
                      </label>
                      <input
                        id="showProfile"
                        name="showProfile"
                        type="checkbox"
                        checked={privacySettings.showProfile}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, showProfile: e.target.checked })}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="showRating" className="block text-sm font-medium text-gray-300">
                        Show Rating
                      </label>
                      <input
                        id="showRating"
                        name="showRating"
                        type="checkbox"
                        checked={privacySettings.showRating}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, showRating: e.target.checked })}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="showMatchHistory" className="block text-sm font-medium text-gray-300">
                        Show Match History
                      </label>
                      <input
                        id="showMatchHistory"
                        name="showMatchHistory"
                        type="checkbox"
                        checked={privacySettings.showMatchHistory}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, showMatchHistory: e.target.checked })}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700"
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Update Privacy"
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

export default SettingsPage
