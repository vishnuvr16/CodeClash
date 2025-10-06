import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import api from "../utils/api"

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/auth/verify")
        setAuthenticated(true)
      } catch (err) {
        setAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) return <div>Loading...</div>
  if (!authenticated) return <Navigate to="/login" replace />
  return children
}

export default ProtectedRoute
