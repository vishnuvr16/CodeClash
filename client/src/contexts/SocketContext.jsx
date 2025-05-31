"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "./AuthContext"
import { toast } from "react-toastify"

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { isAuthenticated, currentUser } = useAuth()

  useEffect(() => {
    let socketInstance = null

    if (isAuthenticated && currentUser) {
      // Connect to socket server with authentication
      const token = localStorage.getItem("token")
      socketInstance = io(import.meta.env.VITE_APP_API_URL || "http://localhost:5173", {
        auth: {
          token,
        },
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })
      // Set up socket event listeners
      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
        toast.error(`Connection error: ${error.message || "Unknown error"}`)
      })

      socketInstance.on("connect", () => {
        console.log("Socket connected")
        setConnected(true)
      })

      socketInstance.on("disconnect", () => {
        console.log("Socket disconnected")
        setConnected(false)
      })

      socketInstance.on("error", (error) => {
        console.error("Socket error:", error)
        toast.error(`Socket error: ${error.message || "Unknown error"}`)
      })

      socketInstance.on("reconnect_attempt", (attemptNumber) => {
        console.log(`Socket reconnection attempt ${attemptNumber}`)
      })

      socketInstance.on("reconnect_failed", () => {
        console.log("Socket reconnection failed")
        toast.error("Failed to reconnect to the server. Please refresh the page.")
      })

      setSocket(socketInstance)
    }

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [isAuthenticated, currentUser])

  // Helper functions for common socket operations
  const emitEvent = (event, data, callback) => {
    if (!socket || !connected) {
      toast.error("Not connected to server")
      return
    }

    if (callback) {
      socket.emit(event, data, callback)
    } else {
      socket.emit(event, data)
    }
  }

  const joinMatchmaking = () => {
    emitEvent("join_matchmaking")
  }

  const cancelMatchmaking = () => {
    emitEvent("cancel_matchmaking")
  }

  const joinMatch = (matchId) => {
    emitEvent("join_match", { matchId })
  }

  const sendCodeUpdate = (matchId, code, language) => {
    emitEvent("code_update", { matchId, code, language })
  }

  const sendProgressUpdate = (matchId, progress) => {
    emitEvent("progress_update", { matchId, progress })
  }

  const sendChatMessage = (matchId, message) => {
    emitEvent("send_message", { matchId, message })
  }

  const value = {
    socket,
    connected,
    emitEvent,
    joinMatchmaking,
    cancelMatchmaking,
    joinMatch,
    sendCodeUpdate,
    sendProgressUpdate,
    sendChatMessage,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
