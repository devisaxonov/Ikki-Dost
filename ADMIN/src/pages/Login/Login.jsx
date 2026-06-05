import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import './Login.css'

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const onChangeHandler = (event) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/admin/login`,
        formData,
      )

      if (response.data.success) {
        onLoginSuccess(response.data.data)
        toast.success(response.data.message)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Admin login qilishda xatolik yuz berdi',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={onSubmitHandler}>
        <p className="admin-login-eyebrow">Admin Access</p>
        <h1>IKKI DOST Admin</h1>
        <p className="admin-login-subtitle">
          Dashboard&apos;ga kirish uchun admin account bilan login qiling.
        </p>

        <div className="admin-login-fields">
          <input
            name="email"
            type="email"
            placeholder="Admin email"
            value={formData.email}
            onChange={onChangeHandler}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={onChangeHandler}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}

export default Login
