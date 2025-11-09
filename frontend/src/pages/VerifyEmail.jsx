import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import './Auth.css'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('verifying') // 'verifying', 'set-password', 'success', 'error'
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
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
      
      // Check if password setup is required
      if (response.data.requiresPasswordSetup) {
        setStatus('set-password')
        setMessage(response.data.message || 'Please set your password to complete registration.')
      } else {
        setStatus('success')
        setMessage(response.data.message || 'Email verified successfully!')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { state: { message: 'Email verified! You can now log in.' } })
        }, 3000)
      }
    } catch (error) {
      setStatus('error')
      setMessage(error.response?.data?.error || 'Failed to verify email. The token may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    setPasswordError('')

    // Validate password
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.setPassword(token, password)
      setStatus('success')
      setMessage(response.data.message || 'Password set successfully! Your account is now fully activated.')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { state: { message: 'Account activated! You can now log in.' } })
      }, 3000)
    } catch (error) {
      setPasswordError(error.response?.data?.error || 'Failed to set password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    navigate('/resend-verification')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Account Activation</h1>
        
        {status === 'verifying' && (
          <>
            <div className="loading">Verifying your email...</div>
            <p className="auth-subtitle">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'set-password' && (
          <>
            <div className="success-message" style={{ 
              background: '#d1fae5', 
              color: '#065f46', 
              padding: '1rem', 
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              {message}
            </div>
            <p className="auth-subtitle">Please set a password to complete your account registration.</p>
            
            <form onSubmit={handleSetPassword}>
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter your password (min 6 characters)"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm your password"
                  disabled={loading}
                />
              </div>

              {passwordError && (
                <div className="error-message">{passwordError}</div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Setting Password...' : 'Set Password & Activate Account'}
              </button>
            </form>
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
