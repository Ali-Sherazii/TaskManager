import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usersAPI } from '../services/api'
import UserModal from '../components/UserModal'
import './Users.css'

const Users = () => {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    if (!isAdmin) {
      return
    }
    loadUsers()
  }, [isAdmin])

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll()
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingUser(null)
    setShowModal(true)
  }

  const handleEditRole = (user) => {
    setEditingUser(user)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingUser(null)
    loadUsers()
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'var(--danger)'
      case 'manager': return 'var(--primary)'
      case 'user': return 'var(--success)'
      default: return 'var(--gray)'
    }
  }

  if (!isAdmin) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You need admin privileges to access this page.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Loading users...</div>
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>User Management</h1>
          <p>Manage users and their roles</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          + Create User
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No users found. Create your first user!
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span 
                      className="role-badge" 
                      style={{ background: getRoleColor(user.role) }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => handleEditRole(user)}
                      className="btn-edit"
                    >
                      Edit Role
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

export default Users





