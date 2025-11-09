import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import './Auth.css'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setStatus('error')
      setMessage('No verification token provided')
    }
  }, [token])

  const verifyEmail = async (verificationToken) => {
    try {
      setLoading(true)
      const response = await authAPI.verifyEmail(verificationToken)
      setStatus('success')
      setMessage(response.data.message || 'Email verified successfully!')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { state: { message: 'Email verified! You can now log in.' } })
      }, 3000)
    } catch (error) {
      setStatus('error')
      setMessage(error.response?.data?.error || 'Failed to verify email. The token may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    // This would require email input, but for now we'll redirect to a resend page
    navigate('/resend-verification')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Email Verification</h1>
        
        {status === 'verifying' && (
          <>
            <div className="loading">Verifying your email...</div>
            <p className="auth-subtitle">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-message" style={{ 
              background: '#d4edda', 
              color: '#155724', 
              padding: '1rem', 
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              {message}
            </div>
            <p className="auth-subtitle">Redirecting to login page...</p>
            <Link to="/login" className="submit-btn" style={{ display: 'inline-block', marginTop: '1rem' }}>
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-message">{message}</div>
            <p className="auth-subtitle">
              The verification link may have expired or is invalid.
            </p>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/resend-verification" className="submit-btn" style={{ display: 'inline-block' }}>
                Resend Verification Email
              </Link>
            </div>
            <p className="auth-footer" style={{ marginTop: '1rem' }}>
              <Link to="/login">Back to Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail

