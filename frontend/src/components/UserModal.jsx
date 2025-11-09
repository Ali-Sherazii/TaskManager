import { useState, useEffect } from 'react'
import { usersAPI } from '../services/api'
import './UserModal.css'

const UserModal = ({ user, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEditingRole, setIsEditingRole] = useState(false)

  useEffect(() => {
    if (user) {
      setIsEditingRole(true)
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        role: user.role || 'user'
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEditingRole) {
        // Update user role only
        await usersAPI.updateRole(user.id, formData.role)
      } else {
        // Create new user
        const submitData = { ...formData }
        if (!submitData.password) {
          throw new Error('Password is required')
        }
        await usersAPI.create(submitData)
      }
      
      onClose()
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditingRole ? 'Edit User Role' : 'Create User'}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isEditingRole ? (
            <>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  disabled
                  style={{ background: 'var(--light)', cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  style={{ background: 'var(--light)', cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : isEditingRole ? 'Update Role' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserModal





