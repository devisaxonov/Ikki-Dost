import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FaUserCircle } from 'react-icons/fa'
import { FiLogOut } from 'react-icons/fi'
import './Navbar.css'

const pageMeta = {
  '/': {
    eyebrow: 'Dashboard',
    title: 'Boshqaruv paneli',
  },
  '/add': {
    eyebrow: 'Yangi taom',
    title: "Mahsulot qo'shish",
  },
  '/list': {
    eyebrow: 'Menyu',
    title: "Mahsulotlar ro'yxati",
  },
  '/orders': {
    eyebrow: 'Buyurtmalar',
    title: 'Mijoz buyurtmalari',
  },
  '/users': {
    eyebrow: 'Foydalanuvchilar',
    title: 'Foydalanuvchilar',
  },
}

const Navbar = ({ adminUser, onLogout }) => {
  const location = useLocation()
  const currentPage = pageMeta[location.pathname] || pageMeta['/']
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  return (
    <div className='navbar'>
      <div className='navbar-copy'>
        <span>{currentPage.eyebrow}</span>
        <h1>{currentPage.title}</h1>
      </div>

      <div className='navbar-admin'>
        <div className='navbar-profile' ref={profileMenuRef}>
          <button
            type='button'
            className='navbar-profile-trigger'
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-label='Admin profil menyusini ochish'
          >
            <FaUserCircle className='navbar-profile-icon' />
          </button>

          {isProfileOpen ? (
            <div className='navbar-profile-menu'>
              <div className='navbar-profile-summary'>
                <FaUserCircle className='navbar-profile-summary-icon' />
                <div className='navbar-profile-summary-content'>
                  <strong>{adminUser?.name || 'Admin'}</strong>
                  <p>{adminUser?.email || 'admin@ikkidost.local'}</p>
                </div>
              </div>

              <button
                type='button'
                className='navbar-menu-item logout'
                onClick={() => {
                  setIsProfileOpen(false)
                  onLogout()
                }}
              >
                <FiLogOut />
                <span>Chiqish</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Navbar
