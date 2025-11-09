import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { tasksAPI } from '../services/api'
import { format } from 'date-fns'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  })
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await tasksAPI.getAll()
      const tasks = response.data.tasks || []
      
      const now = new Date()
      const taskStats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: tasks.filter(t => 
          new Date(t.dueDate) < now && t.status !== 'completed' && t.status !== 'cancelled'
        ).length
      }
      
      setStats(taskStats)
      
      // Get recent tasks (last 5)
      const sorted = [...tasks].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      setRecentTasks(sorted.slice(0, 5))
    } catch (error) {
      console.error('Error loading dashboard:', error)
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
              <div key={task.id} className="task-item">
                <div className="task-main">
                  <h4>{task.title}</h4>
                  <p className="task-description">{task.description || 'No description'}</p>
                  <div className="task-meta">
                    <span className="task-date">
                      Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </span>
                    {task.assignedToUsername && (
                      <span className="task-assigned">
                        Assigned to: {task.assignedToUsername}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-badges">
                  <span 
                    className="badge" 
                    style={{ background: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </span>
                  <span 
                    className="badge" 
                    style={{ background: getStatusColor(task.status) }}
                  >
                    {task.status}
                  </span>
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





