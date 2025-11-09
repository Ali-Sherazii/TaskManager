import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { tasksAPI } from '../services/api'
import './TaskModal.css'

const TaskModal = ({ task, users = [], onClose }) => {
  const { user, isAdmin, isManager } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    status: 'pending',
    priority: 'medium',
    dueDate: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Debug: Log users prop
  useEffect(() => {
    console.log('TaskModal - users prop:', users)
    console.log('TaskModal - users type:', typeof users)
    console.log('TaskModal - users is array:', Array.isArray(users))
    console.log('TaskModal - users length:', users?.length)
  }, [users])

  useEffect(() => {
    if (task) {
      // Convert MongoDB ObjectId to string if needed
      const assignedToId = task.assignedTo?._id ? task.assignedTo._id.toString() : 
                          (task.assignedTo?.toString ? task.assignedTo.toString() : 
                          (task.assignedTo || ''));
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: assignedToId,
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
      })
    } else {
      // Set default due date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        status: 'pending',
        priority: 'medium',
        dueDate: tomorrow.toISOString().slice(0, 16)
      })
    }
  }, [task])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        assignedTo: formData.assignedTo && formData.assignedTo.trim() !== '' ? formData.assignedTo : null,
        dueDate: new Date(formData.dueDate).toISOString()
      }
      
      // Remove undefined fields to avoid sending them
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      if (task) {
        // Update existing task
        // Users can only update status
        if (user.role === 'user') {
          // Only send status for users
          const userSubmitData = { status: submitData.status };
          await tasksAPI.update(task.id, userSubmitData)
        } else {
          // Admin and Manager can update all fields
          await tasksAPI.update(task.id, submitData)
        }
      } else {
        // Create new task
        await tasksAPI.create(submitData)
      }
      
      // Trigger dashboard refresh
      window.dispatchEvent(new Event('dashboard-refresh'))
      onClose()
    } catch (error) {
      console.error('Task save error:', error)
      console.error('Error response:', error.response)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.errors?.[0]?.msg ||
                          error.message || 
                          'Failed to save task'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const isUserRole = user?.role === 'user'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'Create Task'}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={isUserRole && task}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              disabled={isUserRole && task}
              maxLength={1000}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority *</label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                required
                disabled={isUserRole && task}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {(isAdmin || isManager || !task) && (
            <div className="form-group">
              <label htmlFor="assignedTo">Assign To</label>
              <select
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                <option value="">Unassigned</option>
                {users && Array.isArray(users) && users.length > 0 ? (
                  users.map(u => {
                    const userId = u.id || u._id?.toString() || u._id;
                    return (
                      <option key={userId} value={userId}>
                        {u.username} ({u.role})
                      </option>
                    );
                  })
                ) : (
                  <option disabled>No users available</option>
                )}
              </select>
              {(!users || !Array.isArray(users) || users.length === 0) && (
                <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                  {!users ? 'Loading users...' : 'No users found. Make sure you have users in the system.'}
                </small>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="dueDate">Due Date *</label>
            <input
              type="datetime-local"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
              disabled={isUserRole && task}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal


