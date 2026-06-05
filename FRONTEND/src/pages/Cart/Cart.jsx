import { useContext } from "react";
import { StoreContext } from "../../Context/store-context";
import "./Cart.css";
import { useNavigate } from "react-router-dom";
import { formatSom } from "../../utils/formatSom";

const Cart = () => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount, getDeliveryFee } = useContext(StoreContext);
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/order');
  };

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Mahsulot</p>
          <p>Nomi</p>
          <p>Narxi</p>
          <p>Soni</p>
          <p>Jami</p>
          <p>O&apos;chirish</p>
        </div>
        <br />
        <hr />
        
        {food_list.length === 0 ? <p className="cart-empty">Menyu yuklanmoqda yoki hozircha mavjud emas.</p> : null}
        {food_list.map((item) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
              <div className="cart-items-title cart-items-item">
                <img src={item.image} alt={item.name} />
                <p>{item.name}</p>
                <p>{formatSom(item.price)}</p>
                <p>{cartItems[item._id]}</p>
                <p>{formatSom(item.price * cartItems[item._id])}</p>
                <p className='cross' onClick={() => removeFromCart(item._id)}>x</p>
              </div>
                <hr />
              </div>
            )
          }

          return null
         })}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Savatcha hisoboti</h2>
          <div>
            <div className="cart-total-details">
              <p>Oraliq jami</p>
              <p>{formatSom(getTotalCartAmount())}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Yetkazib berish</p>
              <p>{formatSom(getDeliveryFee())}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Umumiy</b>
              <b>{formatSom(getTotalCartAmount() + getDeliveryFee())}</b>
            </div>
          </div>
            <button type="button" onClick={handleCheckout}>Buyurtmani rasmiylashtirish</button>
        </div>
        <div className="cart-promocode">
          <p>Agar promo kodingiz bo&apos;lsa, shu yerga kiriting</p>
          <div className="cart-promocode-input">
            <input type="text" placeholder="Promo kod" />
            <button type="button">Qo&apos;llash</button>
          </div>
        </div>
      </div>

    </div>
  )
};

export default Cart;
