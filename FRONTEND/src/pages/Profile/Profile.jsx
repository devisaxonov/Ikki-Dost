import { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { StoreContext } from '../../Context/store-context'
import {
  formatUzbekPhoneInput,
  isValidUzbekPhone,
  normalizeUzbekPhone,
  UZBEK_PHONE_MESSAGE,
} from '../../utils/uzbekPhone'
import './Profile.css'

const Profile = ({ setShowLogin }) => {
  const location = useLocation()
  const { user, updateProfile, profileLoading } = useContext(StoreContext)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  useEffect(() => {
    if (!user) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone ? formatUzbekPhoneInput(user.phone) : '',
    }))
  }, [user])

  useEffect(() => {
    if (!location.hash) {
      return
    }

    const element = document.querySelector(location.hash)

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location])

  const onChangeHandler = (event) => {
    const { name, value } = event.target
    const nextValue =
      name === 'phone' ? formatUzbekPhoneInput(value) : value

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }))
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    setMessage('')

    if (formData.phone && !isValidUzbekPhone(formData.phone)) {
      setMessageType('error')
      setMessage(UZBEK_PHONE_MESSAGE)
      return
    }

    if (formData.newPassword) {
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/;
      if (formData.newPassword.length < 10) {
        setMessageType('error')
        setMessage("Yangi parol kamida 10 ta belgidan iborat bo'lishi kerak.")
        return
      }
      if (!passwordRegex.test(formData.newPassword)) {
        setMessageType('error')
        setMessage("Yangi parolda kamida 1 ta katta harf, 1 ta raqam va 1 ta maxsus belgi bo'lishi kerak.")
        return
      }
    }

    const normalizedFormData = {
      ...formData,
      phone: formData.phone ? normalizeUzbekPhone(formData.phone) : '',
    }

    const payload = Object.fromEntries(
      Object.entries(normalizedFormData).filter(([, value]) => value.trim() !== ''),
    )

    const result = await updateProfile(payload)

    if (!result.success) {
      setMessageType('error')
      setMessage(result.message)
      return
    }

    setMessageType('success')
    setMessage(result.message)
    setFormData((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
    }))
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="account-empty-state">
          <h2>Profil sozlamalari uchun tizimga kiring</h2>
          <p>
            Profil, sozlamalar va shaxsiy buyurtmalar faqat tizimga kirgan
            foydalanuvchi uchun ko&apos;rinadi.
          </p>
          <button type="button" onClick={() => setShowLogin(true)}>
            Kirish oynasini ochish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-header" id="hisob">
        <div>
          <p className="profile-eyebrow">Shaxsiy kabinet</p>
          <h1>Profil va sozlamalar</h1>
          <p className="profile-subtitle">
            Hisob ma&apos;lumotlaringizni shu yerda boshqarishingiz va yangilashingiz mumkin.
          </p>
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-summary-card">
          <div className="profile-summary-avatar">
            {user.name
              ?.split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('')}
          </div>
          <h2>{user.name}</h2>
          <p>{user.email || "Email ko'rsatilmagan"}</p>
          <div className="profile-summary-list">
            <div>
              <span>Rol</span>
              <strong>{user.role === 'customer' ? 'Mijoz' : user.role}</strong>
            </div>
            <div>
              <span>Telefon</span>
              <strong>
                {user.phone
                  ? formatUzbekPhoneInput(user.phone)
                  : "Telefon ko'rsatilmagan"}
              </strong>
            </div>
            <div>
              <span>Holat</span>
              <strong>{user.isActive ? 'Faol' : 'Faol emas'}</strong>
            </div>
            <div>
              <span>Ro&apos;yxatdan o&apos;tgan sana</span>
              <strong>{new Date(user.createdAt).toLocaleDateString()}</strong>
            </div>
          </div>
        </section>

        <section className="profile-settings-card" id="sozlamalar">
          <div className="profile-settings-head">
            <div>
              <p className="profile-section-label">Sozlamalar</p>
              <h2>Asosiy ma&apos;lumotlarni yangilash</h2>
            </div>
          </div>

          {message ? (
            <p className={messageType === 'error' ? 'profile-message error' : 'profile-message'}>
              {message}
            </p>
          ) : null}

          <form className="profile-form" onSubmit={onSubmitHandler}>
            <div className="profile-form-grid">
              <label>
                <span>Ism</span>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={onChangeHandler}
                  placeholder="Ismingiz"
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={onChangeHandler}
                  placeholder="Email manzil"
                />
              </label>

              <label>
                <span>Telefon</span>
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={onChangeHandler}
                  placeholder="+998 90 123 45 67"
                  maxLength={17}
                />
              </label>
            </div>

            <label>
              <span>Joriy parol</span>
              <input
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={onChangeHandler}
                placeholder="Joriy parolni kiriting"
                autoComplete="new-password"
              />
            </label>

            <label>
              <span>Yangi parol</span>
              <input
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={onChangeHandler}
                placeholder="Yangi parolni kiriting"
                autoComplete="new-password"
              />
            </label>

            <button type="submit" disabled={profileLoading}>
              {profileLoading ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default Profile
