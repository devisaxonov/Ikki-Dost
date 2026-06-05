import './Add.css'
import { assets } from '../../assets/assets'
import { useEffect, useId, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const Add = ({ mode = 'page', onCancel, onSuccess }) => {
  const apiUrl = `${import.meta.env.VITE_API_URL}`
  const imageInputId = useId()
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(assets.upload_area)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [data, setData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
  })

  const hasCategories = categories.length > 0

  const defaultCategory = useMemo(
    () => categories[0]?.name ?? '',
    [categories],
  )

  const fetchCategories = async () => {
    setCategoriesLoading(true)

    try {
      const response = await axios.get(`${apiUrl}/categories`)

      if (response.data.success && Array.isArray(response.data.data)) {
        const nextCategories = response.data.data
        setCategories(nextCategories)
        setData((prev) => ({
          ...prev,
          category:
            nextCategories.some((item) => item.name === prev.category)
              ? prev.category
              : nextCategories[0]?.name ?? '',
        }))
      } else {
        toast.error("Kategoriyalarni yuklab bo'lmadi")
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Kategoriyalarni yuklab bo'lmadi",
      )
      setCategories([])
      setData((prev) => ({ ...prev, category: '' }))
    } finally {
      setCategoriesLoading(false)
    }
  }

  const onChangeHandler = (event) => {
    const { name, value } = event.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    if (!image) {
      toast.error('Rasm tanlang')
      return
    }

    if (!data.category) {
      toast.error("Avval kategoriya qo'shing")
      return
    }

    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('description', data.description)
    formData.append('price', data.price)
    formData.append('category', data.category)
    formData.append('image', image)

    setSubmitting(true)

    try {
      const response = await axios.post(`${apiUrl}/foods`, formData)

      if (response.data.success) {
        setData({
          name: '',
          description: '',
          category: defaultCategory,
          price: '',
        })
        setImage(null)
        toast.success(response.data.message)
        await onSuccess?.()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Mahsulot qo'shishda xatolik yuz berdi",
      )
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (!image) {
      setPreview(assets.upload_area)
      return
    }

    const objectUrl = URL.createObjectURL(image)
    setPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [image])

  const isModal = mode === 'modal'

  return (
    <div className={`add${isModal ? ' add-modal-form' : ''}`}>
      <form className='flex-col' onSubmit={onSubmitHandler}>
        <div className='add-img-upload flex-col'>
          <p>Rasm yuklash</p>
          <label htmlFor={imageInputId} style={{ cursor: 'pointer' }}>
            <img
              src={preview}
              alt='preview'
              style={{ width: '120px', height: '80px', objectFit: 'cover' }}
            />
          </label>
          <input
            onChange={(event) => setImage(event.target.files[0])}
            type='file'
            id={imageInputId}
            hidden
            accept='image/*'
            required
          />
        </div>

        <div className='add-product-name flex-col'>
          <p>Mahsulot nomi</p>
          <input
            onChange={onChangeHandler}
            value={data.name}
            type='text'
            name='name'
            placeholder='Nom kiriting'
            required
          />
        </div>

        <div className='add-product-description flex-col'>
          <p>Tavsif</p>
          <textarea
            onChange={onChangeHandler}
            value={data.description}
            name='description'
            rows='6'
            placeholder='Mahsulot tavsifini kiriting'
            required
          />
        </div>

        <div className='add-category-price'>
          <div className='add-category flex-col'>
            <div className='add-category-head'>
              <p>Kategoriya</p>
            </div>
            <select
              onChange={onChangeHandler}
              value={data.category}
              name='category'
              disabled={!hasCategories || categoriesLoading}
            >
              {!hasCategories ? (
                <option value=''>
                  {categoriesLoading
                    ? 'Kategoriyalar yuklanmoqda...'
                    : "Avval kategoriya qo'shing"}
                </option>
              ) : null}

              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            {!hasCategories && !categoriesLoading ? (
              <span className='add-category-note'>
                Mahsulot qo&apos;shishdan oldin kamida bitta kategoriya yarating.
              </span>
            ) : null}
          </div>

          <div className='add-price flex-col'>
            <p>Narx</p>
            <input
              onChange={onChangeHandler}
              value={data.price}
              type='number'
              name='price'
              placeholder='20'
              required
            />
          </div>
        </div>

        <div className='add-actions'>
          {isModal ? (
            <button
              type='button'
              className='add-cancel-btn'
              onClick={onCancel}
              disabled={submitting}
            >
              Bekor qilish
            </button>
          ) : null}
          <button
            type='submit'
            className='add-btn'
            disabled={!hasCategories || categoriesLoading || submitting}
          >
            {submitting ? "Qo'shilmoqda..." : "Qo'shish"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Add
