import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Settings.css';

const Settings = () => {
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/settings/delivery-fee`);
        if (response.data.success) {
          setDeliveryFee(response.data.data.deliveryFee);
        } else {
          toast.error("Ma'lumotni yuklashda xatolik yuz berdi");
        }
      } catch (error) {
        toast.error("API ga ulanib bo'lmadi");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/settings/delivery-fee`, {
        deliveryFee: Number(deliveryFee)
      });
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error("Saqlashda xatolik yuz berdi");
      }
    } catch (error) {
      toast.error("API ga ulanib bo'lmadi");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings-loading">Yuklanmoqda...</div>;
  }

  return (
    <div className='settings-page'>
      <h2>Tizim sozlamalari</h2>
      <form className='settings-form' onSubmit={handleSubmit}>
        <div className='form-group'>
          <label htmlFor='deliveryFee'>Yetkazib berish narxi (so'm)</label>
          <input 
            type='number' 
            id='deliveryFee' 
            value={deliveryFee} 
            onChange={(e) => setDeliveryFee(e.target.value)} 
            required 
            min="0"
            step="1000"
          />
        </div>
        <button type='submit' className='save-btn' disabled={saving}>
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>
    </div>
  );
};

export default Settings;
