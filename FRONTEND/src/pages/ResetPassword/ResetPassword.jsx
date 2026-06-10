import React, { useContext, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../Context/store-context';
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const { resetPassword } = useContext(StoreContext);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError("Token topilmadi. Iltimos, emailingizdagi havolani tekshiring.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Parollar mos tushmadi!");
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/;
    if (newPassword.length < 10) {
      setError("Parol kamida 10 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (!passwordRegex.test(newPassword)) {
      setError("Parolda kamida 1 ta katta harf, 1 ta raqam va 1 ta maxsus belgi bo'lishi kerak.");
      return;
    }

    setLoading(true);
    const result = await resetPassword({ token, newPassword });
    setLoading(false);

    if (result.success) {
      setMessage("Parol muvaffaqiyatli yangilandi! Endi tizimga kirishingiz mumkin.");
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className='reset-password'>
      <form onSubmit={onSubmitHandler} className="reset-password-container">
        <h2>Yangi parolni kiriting</h2>
        <div className='reset-password-inputs'>
          <input 
            type="password" 
            placeholder="Yangi parol" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Parolni tasdiqlang" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required 
          />
        </div>
        {error && <p className='reset-password-error'>{error}</p>}
        {message && <p className='reset-password-success'>{message}</p>}
        <button type='submit' disabled={loading || !token}>
          {loading ? "Kuting..." : "Parolni yangilash"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
