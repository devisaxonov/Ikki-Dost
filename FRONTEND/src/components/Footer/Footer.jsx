import React from 'react'
import './Footer.css'
import { assets } from '../../assets/frontend_assets/assets'

const Footer = () => {
  return (
    <div className='footer' id='footer'>
          <div className="footer-content">
              <div className="footer-content-left">
                  <img src={assets.logo} alt="" />
                  <p>
                    IKKI DOST sizga mazali taomlarni tez, ishonchli va qulay tarzda yetkazib beradi.
                    Menyumiz har kuni yangilanadi va buyurtmangiz ehtiyotkorlik bilan tayyorlanadi.
                  </p>
                  <div className='footer-social-icons'>
                  <img src={assets.facebook_icon} alt="" />
                  <img src={assets.twitter_icon} alt="" />
                  <img src={assets.linkedin_icon} alt="" />   
                  </div>
              </div>
              <div className="footer-content-right">
                  <h2>Kompaniya</h2>
                  <ul>
                      <li>Bosh sahifa</li>
                      <li>Biz haqimizda</li>
                      <li>Yetkazib berish</li>
                      <li>Maxfiylik siyosati</li>
                  </ul>
              </div>
              <div className="footer-content-center">
                  <h2>Bog&apos;lanish</h2>
                  <ul>
                      <li>+998-(97)-992-24-98</li>
                      <li>xushnidbekisaxonov@gmail.com</li>
                  </ul>
              </div>
          </div>
          <hr />
          <p className="footer-copyright">Mualliflik huquqi 2026. Barcha huquqlar himoyalangan.</p>

    </div>
  )
}

export default Footer
