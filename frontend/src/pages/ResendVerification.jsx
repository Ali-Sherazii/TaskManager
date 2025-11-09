import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import './Auth.css'

const ResendVerification = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await authAPI.resendVerification(email)
      setMessage(response.data.message || 'Verification email sent successfully!')
      setEmail('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Resend Verification Email</h1>
        <p className="auth-subtitle">Enter your email address to receive a new verification link.</p>
        
        {message && (
          <div className="success-message" style={{ 
            background: '#d4edda', 
            color: '#155724', 
            padding: '1rem', 
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {message}
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email address"
            />
          </div>
          
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </form>
        
        <p className="auth-footer">
          Remember your password? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  )
}

export default ResendVerification

