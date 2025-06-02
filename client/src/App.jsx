import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { SocketProvider } from "./contexts/SocketContext"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Pages
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/auth/LoginPage"
import RegisterPage from "./pages/auth/RegisterPage"
import GoogleCallback from "./pages/auth/GoogleCallback"
import Dashboard from "./pages/Dashboard"
import MatchmakingPage from "./pages/MatchmakingPage"
import DuelPage from "./pages/DuelPage"
import ResultPage from "./pages/ResultPage"
import PracticePage from "./pages/PracticePage"
import PracticeProblemPage from "./pages/PracticeProblemPage"
import LeaderboardPage from "./pages/LeaderboardPage"
import TrophyHistoryPage from "./pages/TrophyHistoryPage"
import MatchHistoryPage from "./pages/MatchHistoryPage"
import SettingsPage from "./pages/SettingsPage"
import NotFoundPage from "./pages/NotFoundPage"

// Protected Route Component
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/matchmaking"
                element={
                  <ProtectedRoute>
                    <MatchmakingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/duel/:matchId"
                element={
                  <ProtectedRoute>
                    <DuelPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/result/:matchId"
                element={
                  <ProtectedRoute>
                    <ResultPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice"
                element={
                  <ProtectedRoute>
                    <PracticePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice/:problemId"
                element={
                  <ProtectedRoute>
                    <PracticeProblemPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trophy-history"
                element={
                  <ProtectedRoute>
                    <TrophyHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/match/history"
                element={
                  <ProtectedRoute>
                    <MatchHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
