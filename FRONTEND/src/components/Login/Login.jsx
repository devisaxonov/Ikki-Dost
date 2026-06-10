import { useContext, useState } from 'react'
import { assets } from '../../assets/frontend_assets/assets'
import './Login.css'
import { StoreContext } from '../../Context/store-context';
import {
  formatUzbekPhoneInput,
  isValidUzbekPhone,
  normalizeUzbekPhone,
  UZBEK_PHONE_MESSAGE,
} from '../../utils/uzbekPhone';
const Login = ({ setShowLogin }) => {
    
    const [currState, setCurrState] = useState("Ro'yxatdan o'tish");
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      password: '',
      agree: false,
    });
    const [errorMessage, setErrorMessage] = useState('');
    const { login, register, forgotPassword, authLoading } = useContext(StoreContext);

    const onChangeHandler = (event) => {
      const { name, value, type, checked } = event.target;

      const nextValue =
        name === 'phone' ? formatUzbekPhoneInput(value) : value;

      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : nextValue,
      }));
    };

    const onSubmitHandler = async (event) => {
      event.preventDefault();
      setErrorMessage('');

      if (
        currState === "Ro'yxatdan o'tish" &&
        !isValidUzbekPhone(formData.phone)
      ) {
        setErrorMessage(UZBEK_PHONE_MESSAGE);
        return;
      }

      if (currState === "Parolni tiklash") {
        const result = await forgotPassword({ email: formData.email });
        if (!result.success) {
          setErrorMessage(result.message);
        } else {
          setCurrState("Email yuborildi");
        }
        return;
      }

      if (currState === "Ro'yxatdan o'tish") {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/;
        if (formData.password.length < 10) {
           setErrorMessage("Parol kamida 10 ta belgidan iborat bo'lishi kerak.");
           return;
        }
        if (!passwordRegex.test(formData.password)) {
           setErrorMessage("Parolda kamida 1 ta katta harf, 1 ta raqam va 1 ta maxsus belgi bo'lishi kerak.");
           return;
        }
      }

      const payload =
        currState === "Ro'yxatdan o'tish"
          ? {
              name: formData.name,
              email: formData.email,
              phone: normalizeUzbekPhone(formData.phone),
              password: formData.password,
            }
          : {
              email: formData.email,
              password: formData.password,
            };

      const result =
        currState === "Ro'yxatdan o'tish"
          ? await register(payload)
          : await login(payload);

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      setShowLogin(false);
    };

  return (
    <div className='login'>
          <form onSubmit={onSubmitHandler} className="login-container">
              <div className="login-title">
                  <h2>{currState === "Email yuborildi" ? "Muvaffaqiyatli!" : currState}</h2>
                  <img onClick={()=>setShowLogin(false)} src={assets.cross_icon} alt="" />
              </div>
              
              {currState === "Email yuborildi" ? (
                  <div className='login-success-message'>
                      <p>Parolni tiklash havolasi <br/><strong>{formData.email}</strong><br/> manziliga yuborildi.</p>
                      <p>Iltimos, pochtangizni tekshiring va xatdagi havolaga o'ting.</p>
                      <button type="button" onClick={() => setShowLogin(false)}>Yopish</button>
                  </div>
              ) : (
                  <>
                      <div className='login-inputs'>
                          {currState==="Kirish" || currState==="Parolni tiklash"?<></>:<input name='name' value={formData.name} onChange={onChangeHandler} type="text" placeholder='Ismingiz' required />}
                          {currState==="Kirish" || currState==="Parolni tiklash"?<></>:<input name='phone' value={formData.phone} onChange={onChangeHandler} type="tel" inputMode="tel" autoComplete='tel' placeholder="Telefon raqami (+998 90 123 45 67)" required maxLength={17} />}
                          <input name='email' value={formData.email} onChange={onChangeHandler} type="email" placeholder='Email manzil' required />
                          {currState==="Parolni tiklash"?<></>:<input name='password' value={formData.password} onChange={onChangeHandler} type="password" autoComplete={currState === "Ro'yxatdan o'tish" ? 'new-password' : 'current-password'} placeholder='Parol' required/>}
                      </div>
                      {errorMessage ? <p className='login-error'>{errorMessage}</p> : null}
                      <button type='submit' disabled={authLoading}>{authLoading ? "Iltimos, kuting..." : currState === "Ro'yxatdan o'tish" ? "Hisob yaratish" : currState === "Parolni tiklash" ? "Tasdiqlash" : "Kirish"}</button>
                      
                      {currState === "Parolni tiklash" ? <></> : (
                      <div className="login-condition">
                          <input name='agree' checked={formData.agree} onChange={onChangeHandler} type="checkbox" required />
                          <p>Davom etish orqali foydalanish shartlari va maxfiylik siyosatiga roziman</p>
                      </div>
                      )}
                      {currState==="Kirish" ? 
                        <>
                          <p>Yangi hisob kerakmi? <span onClick={()=>{setCurrState("Ro'yxatdan o'tish"); setErrorMessage('')}}>Shu yerdan oching</span></p>
                          <p>Parolingizni unutdingizmi? <span onClick={()=>{setCurrState("Parolni tiklash"); setErrorMessage('')}}>Tiklash</span></p>
                        </>
                      : currState==="Ro'yxatdan o'tish" ? 
                        <p>Allaqachon hisobingiz bormi? <span onClick={()=>{setCurrState("Kirish"); setErrorMessage('')}}>Kirish</span></p>
                      : 
                        <p>Parolni esladingizmi? <span onClick={()=>{setCurrState("Kirish"); setErrorMessage('')}}>Kirish qismiga o'tish</span></p>
                      }
                  </>
              )}
             
      </form>
    </div>
  )
}

export default Login
