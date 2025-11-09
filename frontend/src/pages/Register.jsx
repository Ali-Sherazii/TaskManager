import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

const Register = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const emailParam = searchParams.get('email')
  const isAdminCreated = !!token

  const [formData, setFormData] = useState({
    username: '',
    email: emailParam || '',
    password: '',
    confirmPassword: '',
    role: 'user'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAdminCreated && emailParam) {
      // Pre-fill email for admin-created users
      setFormData(prev => ({ ...prev, email: emailParam }))
    }
  }, [isAdminCreated, emailParam])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const submitData = {
      ...formData,
      role: formData.role.toLowerCase(),
      token: isAdminCreated ? token : undefined
    }

    // Remove confirmPassword before sending
    delete submitData.confirmPassword

    const result = await register(submitData)
    
    if (result.success) {
      navigate('/login', { 
        state: { 
          message: isAdminCreated 
            ? 'Account registration completed successfully! You can now log in.' 
            : 'Registration successful! Please check your email to verify your account before logging in.' 
        } 
      })
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{isAdminCreated ? 'Complete Your Registration' : 'Register'}</h1>
        <p className="auth-subtitle">
          {isAdminCreated 
            ? 'An account has been created for you. Please set your password to complete registration and start working.'
            : 'Create a new account to get started.'}
        </p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                setFormData({ ...formData, username: value });
              }}
              required
              minLength={3}
              maxLength={30}
              placeholder="Choose a username (letters, numbers, _ only)"
              pattern="[a-zA-Z0-9_]+"
              title="Username can only contain letters, numbers, and underscores"
              disabled={loading}
            />
            <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
              Only letters, numbers, and underscores allowed (no spaces)
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter your email"
              disabled={isAdminCreated || loading}
              style={isAdminCreated ? { background: 'var(--light)', cursor: 'not-allowed' } : {}}
            />
            {isAdminCreated && (
              <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                This email was used to create your account
              </small>
            )}
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
              placeholder="Create a password (min 6 characters)"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={6}
              placeholder="Confirm your password"
              disabled={loading}
            />
          </div>
          
          {!isAdminCreated && (
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={loading}
              >
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (isAdminCreated ? 'Completing Registration...' : 'Registering...') : (isAdminCreated ? 'Complete Registration & Start Working' : 'Register')}
          </button>
        </form>
        
        <p className="auth-footer">
          {!isAdminCreated && (
            <>
              Already have an account? <Link to="/login">Login here</Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export default Register
