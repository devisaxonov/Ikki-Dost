import React, { useEffect, useState } from 'react'
import './List.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import Add from '../Add/add'
import { formatSom } from '../../utils/formatSom'

const List = () => {
  const apiUrl = `${import.meta.env.VITE_API_URL}`
  const [list, setList] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [foodToDelete, setFoodToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [editingFood, setEditingFood] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [editImage, setEditImage] = useState(null)
  const [editPreview, setEditPreview] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
  })

  useEffect(() => {
    if (!editingFood) {
      setEditPreview('')
      return
    }

    if (!editImage) {
      setEditPreview(`${apiUrl}/uploads/${editingFood.image}`)
      return
    }

    const objectUrl = URL.createObjectURL(editImage)
    setEditPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [apiUrl, editImage, editingFood])

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}/categories`)

      if (response.data.success && Array.isArray(response.data.data)) {
        setCategories(response.data.data)
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Kategoriyalarni yuklab bo'lmadi",
      )
    }
  }

  const fetchList = async () => {
    setLoading(true)

    try {
      const response = await axios.get(`${apiUrl}/foods`)

      if (response.data.success && Array.isArray(response.data.data)) {
        setList(response.data.data)
      } else {
        toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi")
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Ma'lumotlarni yuklashda xatolik yuz berdi",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchList()
  }, [])

  const closeAddModal = () => {
    setIsAddModalOpen(false)
  }

  const onAddSuccess = () => {
    closeAddModal()
    void fetchList()
  }

  const removeFood = async () => {
    if (!foodToDelete) {
      return
    }

    setDeleting(true)

    try {
      const response = await axios.delete(`${apiUrl}/foods/${foodToDelete.id}`)

      if (response.data.success) {
        toast.success(response.data.message)
        setFoodToDelete(null)
        await fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Mahsulotni o'chirishda xatolik yuz berdi",
      )
    } finally {
      setDeleting(false)
    }
  }

  const openEditModal = (food) => {
    setEditingFood(food)
    setEditImage(null)
    setEditForm({
      name: food.name,
      description: food.description,
      category: food.category,
      price: String(food.price),
    })
  }

  const closeEditModal = () => {
    setEditingFood(null)
    setEditImage(null)
    setEditPreview('')
    setEditForm({
      name: '',
      description: '',
      category: '',
      price: '',
    })
  }

  const onEditChange = (event) => {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const updateFood = async (event) => {
    event.preventDefault()

    if (!editingFood) {
      return
    }

    const formData = new FormData()
    formData.append('name', editForm.name)
    formData.append('description', editForm.description)
    formData.append('category', editForm.category)
    formData.append('price', editForm.price)

    if (editImage) {
      formData.append('image', editImage)
    }

    setUpdating(true)

    try {
      const response = await axios.patch(
        `${apiUrl}/foods/${editingFood.id}`,
        formData,
      )

      if (response.data.success) {
        toast.success(response.data.message)
        closeEditModal()
        await fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Mahsulotni yangilashda xatolik yuz berdi",
      )
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      <div className='list add flex-col'>
        <div className='list-page-head'>
          <p>Barcha mahsulotlar</p>
          <button
            type='button'
            className='list-add-btn'
            onClick={() => setIsAddModalOpen(true)}
          >
            <FiPlus />
            <span>Qo&apos;shish</span>
          </button>
        </div>
        <div className='list-table-format title'>
          <b>Rasm</b>
          <b>Mahsulot</b>
          <b>Kategoriya</b>
          <b>Narx</b>
          <b>Amallar</b>
        </div>

        {loading && <p className='list-state'>Yuklanmoqda...</p>}

        {!loading && list.length === 0 && (
          <p className='list-state'>Hozircha mahsulotlar yo&apos;q.</p>
        )}

        {!loading &&
          list.map((item) => {
            return (
              <div key={item.id} className='list-table-format list-table-row'>
                <img src={`${apiUrl}/uploads/${item.image}`} alt={item.name} />
                <div className='list-food-main'>
                  <p className='list-food-name'>{item.name}</p>
                  <div className='list-food-mobile-meta'>
                    <span className='list-food-category'>{item.category}</span>
                    <span className='list-food-price'>{formatSom(item.price)}</span>
                  </div>
                </div>
                <p className='list-food-category desktop-only'>{item.category}</p>
                <p className='list-food-price desktop-only'>{formatSom(item.price)}</p>
                <div className='list-row-actions'>
                  <button
                    type='button'
                    onClick={() => openEditModal(item)}
                    className='list-edit-btn'
                    aria-label={`${item.name} mahsulotini tahrirlash`}
                  >
                    <FiEdit2 />
                    <span>Tahrirlash</span>
                  </button>
                  <button
                    type='button'
                    onClick={() =>
                      setFoodToDelete({ id: item.id, name: item.name })
                    }
                    className='list-delete-btn'
                    aria-label={`${item.name} mahsulotini o'chirish`}
                  >
                    <FiTrash2 />
                    <span>O&apos;chirish</span>
                  </button>
                </div>
              </div>
            )
          })}
      </div>

      {isAddModalOpen ? (
        <div className='product-add-modal-overlay'>
          <div className='product-add-modal' role='dialog' aria-modal='true'>
            <div className='product-add-modal-head'>
              <p>Yangi mahsulot</p>
              <h3>Mahsulot qo&apos;shish</h3>
            </div>
            <Add
              mode='modal'
              onCancel={closeAddModal}
              onSuccess={onAddSuccess}
            />
          </div>
        </div>
      ) : null}

      {editingFood ? (
        <div className='delete-modal-overlay'>
          <div className='delete-modal edit-modal product-edit-modal'>
            <h3>Mahsulotni tahrirlash</h3>
            <form className='edit-modal-form' onSubmit={updateFood}>
              <div className='product-edit-preview'>
                <img src={editPreview} alt={editingFood.name} />
                <label className='product-edit-upload'>
                  <span>Yangi rasm</span>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(event) =>
                      setEditImage(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </div>

              <label>
                <span>Mahsulot nomi</span>
                <input
                  type='text'
                  name='name'
                  value={editForm.name}
                  onChange={onEditChange}
                />
              </label>

              <label>
                <span>Tavsif</span>
                <textarea
                  name='description'
                  rows='4'
                  value={editForm.description}
                  onChange={onEditChange}
                />
              </label>

              <div className='product-edit-grid'>
                <label>
                  <span>Kategoriya</span>
                  <select
                    name='category'
                    value={editForm.category}
                    onChange={onEditChange}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Narx</span>
                  <input
                    type='number'
                    name='price'
                    value={editForm.price}
                    onChange={onEditChange}
                  />
                </label>
              </div>

              <div className='delete-modal-actions'>
                <button
                  type='button'
                  className='delete-modal-btn cancel'
                  onClick={closeEditModal}
                  disabled={updating}
                >
                  Bekor qilish
                </button>
                <button
                  type='submit'
                  className='delete-modal-btn confirm'
                  disabled={updating}
                >
                  {updating ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {foodToDelete && (
        <div className='delete-modal-overlay'>
          <div className='delete-modal'>
            <h3>Mahsulotni o&apos;chirish</h3>
            <p>
              <strong>{foodToDelete.name}</strong> ni rostan ham o&apos;chirishni
              xohlaysizmi?
            </p>
            <div className='delete-modal-actions'>
              <button
                type='button'
                className='delete-modal-btn cancel'
                onClick={() => setFoodToDelete(null)}
                disabled={deleting}
              >
                Yo&apos;q
              </button>
              <button
                type='button'
                className='delete-modal-btn confirm'
                onClick={removeFood}
                disabled={deleting}
              >
                {deleting ? "O'chirilmoqda..." : 'Ha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default List
