import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'
import {
  FiClipboard,
  FiGrid,
  FiPackage,
  FiTag,
  FiUsers,
  FiSettings,
} from 'react-icons/fi'

const sidebarItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: FiGrid,
    end: true,
  },
  {
    to: '/orders',
    label: 'Buyurtmalar',
    icon: FiClipboard,
  },
  {
    to: '/list',
    label: 'Mahsulotlar',
    icon: FiPackage,
  },
  {
    to: '/categories',
    label: 'Kategoriyalar',
    icon: FiTag,
  },
  {
    to: '/users',
    label: 'Foydalanuvchilar',
    icon: FiUsers,
  },
  {
    to: '/settings',
    label: 'Sozlamalar',
    icon: FiSettings,
  },
]

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className='sidebar-brand'>
        <img src={assets.logo} alt="IKKI DOST" className='sidebar-brand-logo' />
        <div>
          <span>Ikki Do'st</span>
          <strong>Admin panel</strong>
        </div>
      </div>

      <div className="sidebar-options">
        {sidebarItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="sidebar-option"
              aria-label={item.label}
            >
              <span className='sidebar-option-icon'>
                <Icon />
              </span>
              <p>{item.label}</p>
            </NavLink>
          )
        })}
      </div>

      <div className='sidebar-footnote'>
        <p>Buyurtmalar, menyu va mijozlar bir joydan boshqariladi.</p>
      </div>
    </div>
  )
}

export default Sidebar
