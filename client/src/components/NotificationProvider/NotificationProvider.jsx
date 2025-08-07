"use client"

import { createContext, useContext, useState, useCallback } from "react"
import "./NotificationProvider.css"

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider")
  }
  return context
}

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      type: "info",
      title: "Notification",
      message: "",
      timestamp: new Date(),
      ...notification,
    }

    setNotifications((prev) => [...prev, newNotification])

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id)
    }, 5000)

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const showSuccess = useCallback(
    (title, message) => {
      return addNotification({ type: "success", title, message })
    },
    [addNotification],
  )

  const showError = useCallback(
    (title, message) => {
      return addNotification({ type: "error", title, message })
    },
    [addNotification],
  )

  const showWarning = useCallback(
    (title, message) => {
      return addNotification({ type: "warning", title, message })
    },
    [addNotification],
  )

  const showInfo = useCallback(
    (title, message) => {
      return addNotification({ type: "info", title, message })
    },
    [addNotification],
  )

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            <div className="notification-header">
              <div className="notification-title">{notification.title}</div>
              <button className="notification-close" onClick={() => removeNotification(notification.id)}>
                ×
              </button>
            </div>
            <div className="notification-message">{notification.message}</div>
            <div className="notification-time">{notification.timestamp.toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export default NotificationProvider
