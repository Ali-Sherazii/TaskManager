import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { tasksAPI, usersAPI } from '../services/api'
import { format } from 'date-fns'
import TaskModal from '../components/TaskModal'
import './Tasks.css'

const Tasks = () => {
  const { user, isAdmin, isManager } = useAuth()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: ''
  })

  useEffect(() => {
    loadTasks()
    if (isAdmin || isManager) {
      loadUsers()
    }
  }, [isAdmin, isManager])

  useEffect(() => {
    loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const loadTasks = async () => {
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.priority) params.priority = filters.priority
      // Only send assignedTo if it's not empty (empty means "all users")
      if (filters.assignedTo && filters.assignedTo.trim() !== '') {
        params.assignedTo = filters.assignedTo
      }

      const response = await tasksAPI.getAll(params)
      setTasks(response.data.tasks || [])
      console.log('Tasks loaded:', response.data.tasks?.length || 0, 'tasks')
    } catch (error) {
      console.error('Error loading tasks:', error)
      console.error('Error response:', error.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      console.log('Loading users...')
      const response = await usersAPI.getAll()
      console.log('Users API response:', response)
      console.log('Users data:', response.data)
      console.log('Users array:', response.data?.users)
      
      // Users should already have id field from backend, but ensure it's there
      const formattedUsers = (response.data?.users || []).map(u => ({
        ...u,
        id: u.id || (u._id ? u._id.toString() : null)
      })).filter(u => u.id) // Filter out any users without valid IDs
      
      console.log('Formatted users:', formattedUsers)
      setUsers(formattedUsers)
      console.log('Users state set to:', formattedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      console.error('Error response:', error.response)
      setUsers([]) // Set empty array on error
    }
  }

  const handleCreate = () => {
    setEditingTask(null)
    setShowModal(true)
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    try {
      await tasksAPI.delete(id)
      loadTasks()
      // Trigger dashboard refresh
      window.dispatchEvent(new Event('dashboard-refresh'))
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete task')
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingTask(null)
    loadTasks()
    // Trigger dashboard refresh
    window.dispatchEvent(new Event('dashboard-refresh'))
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

  const isOverdue = (dueDate, status) => {
    return new Date(dueDate) < new Date() && 
           status !== 'completed' && 
           status !== 'cancelled'
  }

  const canEdit = (task) => {
    if (isAdmin) return true
    if (isManager) {
      const createdBy = task.createdBy?.toString ? task.createdBy.toString() : task.createdBy;
      const assignedTo = task.assignedTo?.toString ? task.assignedTo.toString() : task.assignedTo;
      return createdBy === user.id || assignedTo === user.id
    }
    const assignedTo = task.assignedTo?.toString ? task.assignedTo.toString() : task.assignedTo;
    return assignedTo === user.id
  }

  const canDelete = (task) => {
    if (isAdmin) return true
    if (isManager) {
      const createdBy = task.createdBy?.toString ? task.createdBy.toString() : task.createdBy;
      return createdBy === user.id
    }
    return false
  }

  if (loading) {
    return <div className="loading">Loading tasks...</div>
  }

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <div>
          <h1>Tasks</h1>
          <p>Manage and track your tasks</p>
        </div>
        {(isAdmin || isManager) && (
          <button onClick={handleCreate} className="btn-primary">
            + Create Task
          </button>
        )}
      </div>

      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {(isAdmin || isManager) && (
          <select
            value={filters.assignedTo}
            onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
          >
            <option value="">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>
        )}

        <button 
          onClick={() => setFilters({ status: '', priority: '', assignedTo: '' })}
          className="btn-secondary"
        >
          Clear Filters
        </button>
      </div>

      <div className="tasks-grid">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks found. {(isAdmin || isManager) && 'Create your first task!'}</p>
          </div>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              className={`task-card ${isOverdue(task.dueDate, task.status) ? 'overdue' : ''}`}
            >
              <div className="task-card-header">
                <h3>{task.title}</h3>
                <div className="task-actions">
                  {canEdit(task) && (
                    <button 
                      onClick={() => handleEdit(task)}
                      className="icon-btn"
                      title="Edit"
                    >
                      ✏️
                    </button>
                  )}
                  {canDelete(task) && (
                    <button 
                      onClick={() => handleDelete(task.id)}
                      className="icon-btn danger"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {task.description && (
                <p className="task-description">{task.description}</p>
              )}

              <div className="task-info">
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span 
                    className="badge" 
                    style={{ background: getStatusColor(task.status) }}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Priority:</span>
                  <span 
                    className="badge" 
                    style={{ background: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Due Date:</span>
                  <span className={isOverdue(task.dueDate, task.status) ? 'overdue-text' : ''}>
                    {format(new Date(task.dueDate), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>

                {task.assignedToUsername && (
                  <div className="info-row">
                    <span className="info-label">Assigned To:</span>
                    <span>{task.assignedToUsername}</span>
                  </div>
                )}
                
                {task.assignedTo && !task.assignedToUsername && (
                  <div className="info-row">
                    <span className="info-label">Assigned To:</span>
                    <span>User ID: {task.assignedTo}</span>
                  </div>
                )}

                <div className="info-row">
                  <span className="info-label">Created By:</span>
                  <span>{task.createdByUsername}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          users={users || []}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

export default Tasks

