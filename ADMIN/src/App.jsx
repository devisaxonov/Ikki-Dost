import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard/Dashboard'
import Orders from './pages/Orders/Orders'
import List from './pages/List/List'
import Categories from './pages/Categories/Categories'
import { ToastContainer} from 'react-toastify';
import Users from './pages/Users/Users'
import Login from './pages/Login/Login'
import ProtectedRoute from './components/ProtectedRoute'
import {
  clearAdminSession,
  getAdminToken,
  getAdminUser,
  setAdminSession,
} from './utils/adminAuth'
import Add from './pages/Add/add'
import Settings from './pages/Settings/Settings'

const ADMIN_PANEL_ROLES = ['admin', 'superadmin']

const AdminLayout = ({ adminUser, onLogout }) => {
  return (
    <div className='admin-shell'>
      <Sidebar />
      <div className='admin-main'>
        <Navbar adminUser={adminUser} onLogout={onLogout} />
        <div className='admin-content'>
        <Routes>
          <Route path='/' element={<Dashboard/>} />
          <Route path='add' element={<Add/>} />
          <Route path='categories' element={<Categories/>} />
          <Route path='list' element={<List/>} />
          <Route path='orders' element={<Orders/>} />
          <Route path='users' element={<Users adminUser={adminUser}/>} />
          <Route path='settings' element={<Settings/>} />
        </Routes>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  const [adminUser, setAdminUser] = useState(getAdminUser())
  const [authChecked, setAuthChecked] = useState(false)

  const applyAdminToken = (token) => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`
      return
    }

    delete axios.defaults.headers.common.Authorization
  }

  const logout = () => {
    clearAdminSession()
    applyAdminToken('')
    setAdminUser(null)
  }

  const onLoginSuccess = ({ token, user }) => {
    setAdminSession({ token, user })
    applyAdminToken(token)
    setAdminUser(user)
  }

  useEffect(() => {
    const token = getAdminToken()

    if (!token) {
      logout()
      setAuthChecked(true)
      return
    }

    applyAdminToken(token)

    axios
      .get(`${import.meta.env.VITE_API_URL}/auth/me`)
      .then((response) => {
        const user = response.data.data

        if (!user || !ADMIN_PANEL_ROLES.includes(user.role)) {
          logout()
          return
        }

        setAdminSession({ token, user })
        setAdminUser(user)
      })
      .catch(() => {
        logout()
      })
      .finally(() => {
        setAuthChecked(true)
      })
  }, [])

  if (!authChecked) {
    return <div className='auth-loading'>Checking admin session...</div>
  }

  return (
    <>
      <ToastContainer/>
      <Routes>
        <Route
          path='/login'
          element={
            adminUser ? (
              <Navigate to='/' replace />
            ) : (
              <Login onLoginSuccess={onLoginSuccess} />
            )
          }
        />
        <Route
          path='/*'
          element={
            <ProtectedRoute user={adminUser}>
              <AdminLayout adminUser={adminUser} onLogout={logout} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App
