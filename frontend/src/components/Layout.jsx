import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NotificationMenu from './NotificationMenu'
import './Layout.css'

const Layout = () => {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <h2>Task Manager</h2>
          </div>
          <div className="nav-links">
            <Link 
              to="/dashboard" 
              className={isActive('/dashboard') ? 'active' : ''}
            >
              Dashboard
            </Link>
            <Link 
              to="/tasks" 
              className={isActive('/tasks') ? 'active' : ''}
            >
              Tasks
            </Link>
            {isAdmin && (
              <Link 
                to="/users" 
                className={isActive('/users') ? 'active' : ''}
              >
                Users
              </Link>
            )}
          </div>
          <div className="nav-user">
            <NotificationMenu />
            <span className="user-info">
              {user?.username} ({user?.role})
            </span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout





