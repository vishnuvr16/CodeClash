import axios from "axios"

// Create axios instance with base URL from environment variables
const api = axios.create({
  baseURL: `${import.meta.env.VITE_APP_API_URL || "http://localhost:5000"}`,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to include auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if not already there
      if (localStorage.getItem("token")) {
        localStorage.removeItem("token")
        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
