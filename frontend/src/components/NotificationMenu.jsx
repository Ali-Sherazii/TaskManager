import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { notificationsAPI } from '../services/api'
import { format } from 'date-fns'
import './NotificationMenu.css'

const NotificationMenu = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef(null)
  const eventSourceRef = useRef(null)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
    setupSSE()

    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const setupSSE = () => {
    const token = localStorage.getItem('token')
    if (!token) return

    // EventSource doesn't support custom headers, so we'll use query parameter
    // The backend will extract token from Authorization header or query param
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const url = `${baseURL}/api/notifications/stream?token=${encodeURIComponent(token)}`
    
    const eventSource = new EventSource(url)

    // Handle SSE connection
    eventSource.onopen = () => {
      console.log('SSE connection opened')
    }

    // Handle incoming notifications
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'notification') {
          // Add new notification to the list
          setNotifications(prev => [data.notification, ...prev])
          setUnreadCount(prev => prev + 1)
        } else if (data.type === 'unread_count') {
          setUnreadCount(data.count)
        } else if (data.type === 'connected') {
          console.log('SSE connected:', data.message)
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          setupSSE()
        }
      }, 5000)
    }

    eventSourceRef.current = eventSource
  }

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsAPI.getAll({ limit: 20, unreadOnly: false })
      setNotifications(response.data.notifications || [])
      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount()
      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDelete = async (notificationId) => {
    try {
      await notificationsAPI.delete(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      // Update unread count if deleted notification was unread
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336'
      case 'medium': return '#ff9800'
      case 'low': return '#4CAF50'
      default: return '#666'
    }
  }

  const unreadNotifications = notifications.filter(n => !n.isRead)

  return (
    <div className="notification-menu" ref={menuRef}>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadNotifications.length > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <div className="notification-content">
                    <div className="notification-title-row">
                      <h4>{notification.title}</h4>
                      {notification.priority && (
                        <span
                          className="notification-priority"
                          style={{ backgroundColor: getPriorityColor(notification.priority) }}
                        >
                          {notification.priority}
                        </span>
                      )}
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    <div className="notification-meta">
                      <span className="notification-time">
                        {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                      {notification.dueDate && (
                        <span className="notification-due">
                          Due: {format(new Date(notification.dueDate), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button
                        className="mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id)
                      }}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationMenu

