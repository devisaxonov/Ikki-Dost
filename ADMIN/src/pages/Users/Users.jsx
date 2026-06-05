import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiPlus } from 'react-icons/fi'
import useRefreshOnActive from '../../hooks/useRefreshOnActive'
import './Users.css'

const ROLE_LABELS = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  customer: 'Mijoz',
}

const initialAdminForm = {
  name: '',
  email: '',
  password: '',
}

const Users = ({ adminUser }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creatingAdmin, setCreatingAdmin] = useState(false)
  const [adminForm, setAdminForm] = useState(initialAdminForm)

  const url = `${import.meta.env.VITE_API_URL}`
  const isSuperAdmin = adminUser?.role === 'superadmin'

  const fetchUsers = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
    }

    try {
      const response = await axios.get(`${url}/users`)

      if (response.data.success && Array.isArray(response.data.data)) {
        setUsers(response.data.data)
      } else {
        if (!silent) {
          toast.error("Foydalanuvchilarni yuklashda xatolik yuz berdi")
        }
      }
    } catch (error) {
      if (!silent) {
        toast.error(
          error.response?.data?.message ||
            "Foydalanuvchilarni yuklashda xatolik yuz berdi",
        )
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [url])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  useRefreshOnActive(() => {
    void fetchUsers({ silent: true })
  })

  const closeCreateModal = () => {
    setIsCreateOpen(false)
    setAdminForm(initialAdminForm)
  }

  const onAdminFormChange = (event) => {
    const { name, value } = event.target

    setAdminForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const createAdmin = async (event) => {
    event.preventDefault()
    setCreatingAdmin(true)

    try {
      const response = await axios.post(`${url}/users/admins`, adminForm)

      if (response.data.success) {
        toast.success(response.data.message)
        closeCreateModal()
        await fetchUsers({ silent: true })
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Admin qo'shishda xatolik yuz berdi",
      )
    } finally {
      setCreatingAdmin(false)
    }
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <p className="users-eyebrow">Foydalanuvchilar</p>
          <h2>Barcha foydalanuvchilar</h2>
        </div>
        {isSuperAdmin ? (
          <button
            type="button"
            className="users-create-admin-btn"
            onClick={() => setIsCreateOpen(true)}
          >
            <FiPlus />
            <span>Admin qo&apos;shish</span>
          </button>
        ) : null}
      </div>

      <div className="users-table-shell">
        <div className="users-table users-table-title">
          <b>ID</b>
          <b>Ism</b>
          <b>Email</b>
          <b>Rol</b>
        </div>

        {loading && <p className="users-state">Yuklanmoqda...</p>}

        {!loading && users.length === 0 && (
          <p className="users-state">Hozircha foydalanuvchilar mavjud emas.</p>
        )}

        {!loading &&
          users.map((user, index) => (
            <div key={user.id} className="users-table">
              <p className="users-id">{index + 1}</p>
              <p className="users-name">{user.name || "Nomi yo'q"}</p>
              <p className="users-email">{user.email || "Email yo'q"}</p>
              <p className={`users-role role-${user.role}`}>
                {ROLE_LABELS[user.role] || user.role}
              </p>
            </div>
          ))}
      </div>

      {isCreateOpen ? (
        <div className="users-modal-overlay">
          <div className="users-modal" role="dialog" aria-modal="true">
            <div className="users-modal-head">
              <p>Yangi admin</p>
              <h3>Admin qo&apos;shish</h3>
            </div>
            <form className="users-admin-form" onSubmit={createAdmin}>
              <label>
                <span>Ism</span>
                <input
                  type="text"
                  name="name"
                  value={adminForm.name}
                  onChange={onAdminFormChange}
                  placeholder="Admin ismi"
                  required
                  minLength={2}
                  maxLength={60}
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={adminForm.email}
                  onChange={onAdminFormChange}
                  placeholder="admin@example.com"
                  required
                />
              </label>
              <label>
                <span>Parol</span>
                <input
                  type="password"
                  name="password"
                  value={adminForm.password}
                  onChange={onAdminFormChange}
                  placeholder="Kamida 8 ta belgi"
                  required
                  minLength={8}
                  maxLength={72}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+"
                  title="Parolda kamida bitta katta harf, bitta kichik harf va bitta raqam bo'lishi kerak"
                />
              </label>
              <div className="users-modal-actions">
                <button
                  type="button"
                  className="cancel"
                  onClick={closeCreateModal}
                  disabled={creatingAdmin}
                >
                  Bekor qilish
                </button>
                <button type="submit" disabled={creatingAdmin}>
                  {creatingAdmin ? "Qo'shilmoqda..." : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Users
