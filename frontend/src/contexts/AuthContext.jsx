import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { setCookie, getCookie, deleteCookie } from '../utils/cookies'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = getCookie('user')
    const token = getCookie('token')
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(decodeURIComponent(storedUser)))
      } catch (error) {
        deleteCookie('user')
        deleteCookie('token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password })
      const { token, user } = response.data
      
      // Store token and user in cookies (7 days expiration)
      setCookie('token', token, 7)
      setCookie('user', encodeURIComponent(JSON.stringify(user)), 7)
      setUser(user)
      
      // Trigger dashboard refresh event for real-time updates
      window.dispatchEvent(new Event('dashboard-refresh'))
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
        requiresVerification: error.response?.data?.requiresVerification || false
      }
    }
  }

  const register = async (userData) => {
    try {
      // Normalize role to lowercase before sending
        const normalizedData = {
          ...userData,
          role: userData.role ? userData.role.toLowerCase() : 'user'
        }
        // Remove undefined fields
        Object.keys(normalizedData).forEach(key => {
          if (normalizedData[key] === undefined) {
            delete normalizedData[key]
          }
        })
        const response = await authAPI.register(normalizedData)
        return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Registration failed'
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      deleteCookie('token')
      deleteCookie('user')
      setUser(null)
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isUser: user?.role === 'user'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


