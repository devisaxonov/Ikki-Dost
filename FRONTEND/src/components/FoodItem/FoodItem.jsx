import React, { useContext } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/frontend_assets/assets'
import { StoreContext } from '../../Context/store-context';
import { formatSom } from '../../utils/formatSom';

const FoodItem = ({ id, name, description, price, image }) => {
    
    const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);
    
  return (
      <div className='food-item'>
          <div className="food-item-img-container">
              <img className='food-item-image' src={image} alt={name} />
              {!cartItems[id] 
                  ? <img className='add' onClick={()=>addToCart(id)} src={assets.add_icon_white } alt="Savatchaga qo'shish" />
                  : <div className='food-item-counter'>
                      <img onClick={()=>removeFromCart(id)} src={assets.remove_icon_red} alt="Bittaga kamaytirish" />
                      <p>{cartItems[id]}</p>
                      <img onClick={()=>addToCart(id)} src={assets.add_icon_green} alt="Bittaga oshirish" />
                  </div>
              }
          </div>
          <div className="food-item-info">
              <div className="food-item-name-rating">
                  <p>{name}</p>
                  <img src={assets.rating_starts} alt="Reyting" />
              </div>
              <p className="food-item-description">{description}</p>
              <p className='food-item-price'>{formatSom(price)}</p>
          </div>
    </div>
  )
}

export default FoodItem
