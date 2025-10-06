import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

const GoogleCallback = () => {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { loginWithGoogleCode } = useAuth()

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Get the authorization code from URL
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")

        if (!code) {
          throw new Error("No authorization code found in the URL")
        }

        await loginWithGoogleCode(code)

        // Redirect to the original page or dashboard
        const redirectPath = localStorage.getItem("authRedirect") || "/dashboard"
        localStorage.removeItem("authRedirect")
        navigate("/dashboard")
      } catch (err) {
        console.error("Google authentication error:", err)
        setError(err.message || "Authentication failed")
      } finally {
        setLoading(false)
      }
    }

    handleGoogleCallback()
  }, [navigate, loginWithGoogleCode])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Completing Google Sign-In...</h2>
          <p className="text-gray-400 mt-2">Please wait while we authenticate you</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-400">Authentication Error</h2>
          <p className="text-gray-400 mt-2">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default GoogleCallback
