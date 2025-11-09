import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { tasksAPI, usersAPI } from '../services/api'
import { format } from 'date-fns'
import { getCookie } from '../utils/cookies'
import './Dashboard.css'

const Dashboard = () => {
  const { user, isAdmin, isManager, isUser } = useAuth()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  })
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Admin-specific stats
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    usersByRole: { admin: 0, manager: 0, user: 0 },
    tasksByStatus: { pending: 0, 'in-progress': 0, completed: 0, cancelled: 0 },
    overdueTasks: 0
  })
  const [allUsers, setAllUsers] = useState([])
  
  // Manager-specific stats
  const [managerStats, setManagerStats] = useState({
    createdTasks: 0,
    assignedTasks: 0,
    teamTasks: 0
  })

  const eventSourceRef = useRef(null)
  const refreshIntervalRef = useRef(null)

  // Load dashboard data
  const refreshDashboard = () => {
    if (isAdmin) {
      loadAdminDashboard()
    } else if (isManager) {
      loadManagerDashboard()
    } else {
      loadUserDashboard()
    }
  }

  useEffect(() => {
    // Initial load
    refreshDashboard()

    // Set up SSE for real-time updates
    setupSSE()

    // Set up periodic refresh as fallback (every 30 seconds)
    refreshIntervalRef.current = setInterval(() => {
      refreshDashboard()
    }, 30000)

    // Listen for custom refresh events (from other components)
    const handleRefresh = () => {
      refreshDashboard()
    }
    window.addEventListener('dashboard-refresh', handleRefresh)

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      window.removeEventListener('dashboard-refresh', handleRefresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isManager, isUser])

  // Set up Server-Sent Events for real-time updates
  const setupSSE = () => {
    const token = getCookie('token')
    if (!token) return

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const url = `${baseURL}/api/notifications/stream?token=${encodeURIComponent(token)}`
    
    const eventSource = new EventSource(url)

    eventSource.onopen = () => {
      console.log('Dashboard SSE connection opened')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Refresh dashboard when new notification arrives
        if (data.type === 'notification') {
          refreshDashboard()
        } else if (data.type === 'task_updated' || data.type === 'task_created' || data.type === 'task_deleted') {
          // Immediate refresh for task changes
          refreshDashboard()
        } else if (data.type === 'user_created' || data.type === 'user_updated') {
          // Refresh admin dashboard when users change
          if (isAdmin) {
            refreshDashboard()
          }
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('Dashboard SSE error:', error)
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          setupSSE()
        }
      }, 5000)
    }

    eventSourceRef.current = eventSource
  }

  // User Dashboard - Shows assigned tasks
  const loadUserDashboard = async () => {
    try {
      const response = await tasksAPI.getAll({ limit: 100 })
      const tasks = response.data?.tasks || []
      
      const now = new Date()
      const taskStats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: tasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed' && t.status !== 'cancelled'
        ).length
      }
      
      setStats(taskStats)
      
      const sorted = [...tasks].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
        return dateB - dateA
      })
      setRecentTasks(sorted.slice(0, 5))
    } catch (error) {
      console.error('Error loading user dashboard:', error)
      setStats({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 })
      setRecentTasks([])
    } finally {
      setLoading(false)
    }
  }

  // Manager Dashboard - Shows tasks they created or are assigned to
  const loadManagerDashboard = async () => {
    try {
      const response = await tasksAPI.getAll({ limit: 100 })
      const tasks = response.data?.tasks || []
      
      const now = new Date()
      const createdTasks = tasks.filter(t => t.createdBy === user.id)
      const assignedTasks = tasks.filter(t => t.assignedTo === user.id)
      
      const taskStats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: tasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed' && t.status !== 'cancelled'
        ).length
      }
      
      const managerStatsData = {
        createdTasks: createdTasks.length,
        assignedTasks: assignedTasks.length,
        teamTasks: tasks.length
      }
      
      setStats(taskStats)
      setManagerStats(managerStatsData)
      
      const sorted = [...tasks].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
        return dateB - dateA
      })
      setRecentTasks(sorted.slice(0, 5))
    } catch (error) {
      console.error('Error loading manager dashboard:', error)
      setStats({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 })
      setManagerStats({ createdTasks: 0, assignedTasks: 0, teamTasks: 0 })
      setRecentTasks([])
    } finally {
      setLoading(false)
    }
  }

  // Admin Dashboard - Shows system-wide statistics
  const loadAdminDashboard = async () => {
    try {
      const [tasksResponse, usersResponse] = await Promise.all([
        tasksAPI.getAll({ limit: 100 }),
        usersAPI.getAll()
      ])
      
      const tasks = tasksResponse.data?.tasks || []
      const users = usersResponse.data?.users || []
      
      const now = new Date()
      const usersByRole = {
        admin: users.filter(u => u.role === 'admin').length,
        manager: users.filter(u => u.role === 'manager').length,
        user: users.filter(u => u.role === 'user').length
      }
      
      const tasksByStatus = {
        pending: tasks.filter(t => t.status === 'pending').length,
        'in-progress': tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        cancelled: tasks.filter(t => t.status === 'cancelled').length
      }
      
      const overdueTasks = tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed' && t.status !== 'cancelled'
      ).length
      
      const adminStatsData = {
        totalUsers: users.length,
        totalTasks: tasks.length,
        usersByRole,
        tasksByStatus,
        overdueTasks
      }
      
      setAdminStats(adminStatsData)
      setAllUsers(users)
      
      const sorted = [...tasks].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
        return dateB - dateA
      })
      setRecentTasks(sorted.slice(0, 5))
    } catch (error) {
      console.error('Error loading admin dashboard:', error)
      setAdminStats({
        totalUsers: 0,
        totalTasks: 0,
        usersByRole: { admin: 0, manager: 0, user: 0 },
        tasksByStatus: { pending: 0, 'in-progress': 0, completed: 0, cancelled: 0 },
        overdueTasks: 0
      })
      setAllUsers([])
      setRecentTasks([])
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--danger)'
      case 'medium': return 'var(--warning)'
      case 'low': return 'var(--success)'
      default: return 'var(--gray)'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--success)'
      case 'in-progress': return 'var(--primary)'
      case 'pending': return 'var(--warning)'
      case 'cancelled': return 'var(--gray)'
      default: return 'var(--gray)'
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  // Admin Dashboard
  if (isAdmin) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.username}! System overview and statistics</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
              👥
            </div>
            <div className="stat-content">
              <h3>{adminStats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
              📋
            </div>
            <div className="stat-content">
              <h3>{adminStats.totalTasks}</h3>
              <p>Total Tasks</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
              ⏳
            </div>
            <div className="stat-content">
              <h3>{adminStats.tasksByStatus.pending}</h3>
              <p>Pending Tasks</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
              🔄
            </div>
            <div className="stat-content">
              <h3>{adminStats.tasksByStatus['in-progress']}</h3>
              <p>In Progress</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              ✅
            </div>
            <div className="stat-content">
              <h3>{adminStats.tasksByStatus.completed}</h3>
              <p>Completed</p>
            </div>
          </div>

          {adminStats.overdueTasks > 0 && (
            <div className="stat-card stat-card-danger">
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                ⚠️
              </div>
              <div className="stat-content">
                <h3>{adminStats.overdueTasks}</h3>
                <p>Overdue Tasks</p>
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-sections">
          <div className="dashboard-section">
            <h2>Users by Role</h2>
            <div className="role-stats">
              <div className="role-stat-item">
                <span className="role-label">Admins:</span>
                <span className="role-count">{adminStats.usersByRole.admin}</span>
              </div>
              <div className="role-stat-item">
                <span className="role-label">Managers:</span>
                <span className="role-count">{adminStats.usersByRole.manager}</span>
              </div>
              <div className="role-stat-item">
                <span className="role-label">Users:</span>
                <span className="role-count">{adminStats.usersByRole.user}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Recent Tasks</h2>
            {recentTasks.length === 0 ? (
              <p className="empty-state">No tasks yet</p>
            ) : (
              <div className="tasks-list">
                {recentTasks.map(task => (
                  <div key={task.id || task._id} className="task-item">
                    <div className="task-main">
                      <h4>{task.title}</h4>
                      <p className="task-description">{task.description || 'No description'}</p>
                      <div className="task-meta">
                        {task.dueDate && (
                          <span className="task-date">
                            Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                          </span>
                        )}
                        {task.assignedToUsername && (
                          <span className="task-assigned">
                            Assigned to: {task.assignedToUsername}
                          </span>
                        )}
                        {task.createdByUsername && (
                          <span className="task-created">
                            Created by: {task.createdByUsername}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="task-badges">
                      {task.priority && (
                        <span 
                          className="badge" 
                          style={{ background: getPriorityColor(task.priority) }}
                        >
                          {task.priority}
                        </span>
                      )}
                      {task.status && (
                        <span 
                          className="badge" 
                          style={{ background: getStatusColor(task.status) }}
                        >
                          {task.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Manager Dashboard
  if (isManager) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Manager Dashboard</h1>
          <p>Welcome back, {user?.username}! Overview of your team and tasks</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
              📋
            </div>
            <div className="stat-content">
              <h3>{managerStats.teamTasks}</h3>
              <p>Team Tasks</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              ✏️
            </div>
            <div className="stat-content">
              <h3>{managerStats.createdTasks}</h3>
              <p>Tasks Created</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              📌
            </div>
            <div className="stat-content">
              <h3>{managerStats.assignedTasks}</h3>
              <p>Tasks Assigned to Me</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
              ⏳
            </div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              ✅
            </div>
            <div className="stat-content">
              <h3>{stats.completed}</h3>
              <p>Completed</p>
            </div>
          </div>

          {stats.overdue > 0 && (
            <div className="stat-card stat-card-danger">
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                ⚠️
              </div>
              <div className="stat-content">
                <h3>{stats.overdue}</h3>
                <p>Overdue</p>
              </div>
            </div>
          )}
        </div>

        <div className="recent-tasks">
          <h2>Recent Tasks</h2>
          {recentTasks.length === 0 ? (
            <p className="empty-state">No tasks yet. Create your first task!</p>
          ) : (
            <div className="tasks-list">
              {recentTasks.map(task => (
                <div key={task.id || task._id} className="task-item">
                  <div className="task-main">
                    <h4>{task.title}</h4>
                    <p className="task-description">{task.description || 'No description'}</p>
                    <div className="task-meta">
                      {task.dueDate && (
                        <span className="task-date">
                          Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                        </span>
                      )}
                      {task.assignedToUsername && (
                        <span className="task-assigned">
                          Assigned to: {task.assignedToUsername}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-badges">
                    {task.priority && (
                      <span 
                        className="badge" 
                        style={{ background: getPriorityColor(task.priority) }}
                      >
                        {task.priority}
                      </span>
                    )}
                    {task.status && (
                      <span 
                        className="badge" 
                        style={{ background: getStatusColor(task.status) }}
                      >
                        {task.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // User Dashboard (default - current implementation)
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.username}!</h1>
        <p>Here's an overview of your tasks</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
            📋
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            ⏳
          </div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
            🔄
          </div>
          <div className="stat-content">
            <h3>{stats.inProgress}</h3>
            <p>In Progress</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            ✅
          </div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>

        {stats.overdue > 0 && (
          <div className="stat-card stat-card-danger">
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
              ⚠️
            </div>
            <div className="stat-content">
              <h3>{stats.overdue}</h3>
              <p>Overdue</p>
            </div>
          </div>
        )}
      </div>

      <div className="recent-tasks">
        <h2>Recent Tasks</h2>
        {recentTasks.length === 0 ? (
          <p className="empty-state">No tasks yet. Create your first task!</p>
        ) : (
          <div className="tasks-list">
            {recentTasks.map(task => (
              <div key={task.id || task._id} className="task-item">
                <div className="task-main">
                  <h4>{task.title}</h4>
                  <p className="task-description">{task.description || 'No description'}</p>
                  <div className="task-meta">
                    {task.dueDate && (
                      <span className="task-date">
                        Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                      </span>
                    )}
                    {task.assignedToUsername && (
                      <span className="task-assigned">
                        Assigned to: {task.assignedToUsername}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-badges">
                  {task.priority && (
                    <span 
                      className="badge" 
                      style={{ background: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>
                  )}
                  {task.status && (
                    <span 
                      className="badge" 
                      style={{ background: getStatusColor(task.status) }}
                    >
                      {task.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard





