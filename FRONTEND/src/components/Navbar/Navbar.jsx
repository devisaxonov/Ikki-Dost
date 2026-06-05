import React, { useContext, useEffect, useRef, useState } from 'react';
import './Navbar.css';
import { assets } from '../../assets/frontend_assets/assets';
import { Link, useLocation } from 'react-router-dom';
import {
  FiLogOut,
  FiShoppingBag,
  FiUser,
} from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import { StoreContext } from '../../Context/store-context';

const Navbar = ({ setShowLogin }) => {
    const [menu, setMenu] = useState('home');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const location = useLocation();
    const {getTotalCartAmount, user, logout} = useContext(StoreContext);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          profileMenuRef.current &&
          !profileMenuRef.current.contains(event.target)
        ) {
          setIsProfileOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    useEffect(() => {
      if (location.pathname !== '/') {
        setMenu('');
        return;
      }

      if (location.hash === '#explore-menu') {
        setMenu('menu');
        return;
      }

      if (location.hash === '#footer') {
        setMenu('contact-us');
        return;
      }

      setMenu('home');
    }, [location]);

  return (
    <div className='navbar'>
      <Link to='/'>
        <img src={assets.logo} alt="IKKI DOST logotipi" className='logo' />
      </Link>

      <ul className='navbar-menu'>
        <Link 
          to='/' 
          onClick={() => setMenu('home')} 
          className={menu === "home" ? "active" : ""}
        >
          Bosh sahifa
        </Link>

        <Link 
          to='/#explore-menu'
          onClick={() => setMenu('menu')} 
          className={menu === "menu" ? "active" : ""}
        >
          Menyu
        </Link>
        
        <Link 
          to='/#footer'
          onClick={() => setMenu('contact-us')} 
          className={menu === "contact-us" ? "active" : ""}
        >
          Bog'lanish
        </Link>
      </ul>

      <div className="navbar-right">
        <img src={assets.search_icon} alt="Qidirish" className='navbar-plain-icon' />
        <div className="navbar-search-icon">
          <Link to='/cart'>
            <img src={assets.basket_icon} alt="Savatcha" className='navbar-plain-icon' />
          </Link>
          <div className={getTotalCartAmount()===0?"":'dot'}></div>
        </div>
        {user ? (
          <div className='navbar-profile' ref={profileMenuRef}>
            <button
              type='button'
              className='navbar-profile-trigger'
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-label='Profil menyusini ochish'
            >
              <FaUserCircle className='navbar-profile-icon' />
            </button>

            {isProfileOpen ? (
              <div className='navbar-profile-menu'>
                <div className='navbar-profile-summary'>
                  <FaUserCircle className='navbar-profile-summary-icon' />
                  <div className='navbar-profile-summary-content'>
                    <strong>{user.name}</strong>
                    <p>{user.email || "Email ko'rsatilmagan"}</p>
                  </div>
                </div>

                <Link
                  to='/profil#hisob'
                  className='navbar-menu-item'
                  onClick={() => setIsProfileOpen(false)}
                >
                  <FiUser />
                  <span>Profilim</span>
                </Link>

                <Link
                  to='/buyurtmalarim'
                  className='navbar-menu-item'
                  onClick={() => setIsProfileOpen(false)}
                >
                  <FiShoppingBag />
                  <span>Buyurtmalarim</span>
                </Link>

                <button
                  type='button'
                  className='navbar-menu-item logout'
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                >
                  <FiLogOut />
                  <span>Chiqish</span>
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <button onClick={() => setShowLogin(true)}>Kirish</button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
