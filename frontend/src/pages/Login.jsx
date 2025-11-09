import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [requiresVerification, setRequiresVerification] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Check for message from registration or verification
  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message)
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setRequiresVerification(false)
    setLoading(true)

    const result = await login(formData.username, formData.password)
    
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
      // Check if error is due to unverified email
      if (result.requiresVerification) {
        setRequiresVerification(true)
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login</h1>
        <p className="auth-subtitle">Welcome back! Please login to your account.</p>
        
        {error && <div className="error-message">{error}</div>}
        
        {requiresVerification && (
          <div style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffc107', 
            padding: '1rem', 
            borderRadius: '4px',
            marginBottom: '1rem',
            color: '#856404'
          }}>
            <p style={{ margin: 0, marginBottom: '0.5rem' }}>
              Your email address has not been verified yet.
            </p>
            <Link to="/resend-verification" style={{ color: '#856404', textDecoration: 'underline' }}>
              Resend verification email
            </Link>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="Enter your username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  )
}

export default Login





