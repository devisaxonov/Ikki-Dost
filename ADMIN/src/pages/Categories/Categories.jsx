import './Categories.css'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FiEdit2, FiImage, FiPlus, FiTag, FiTrash2 } from 'react-icons/fi'

const resolveImageUrl = (apiUrl, imagePath) => {
  if (!imagePath) {
    return ''
  }

  return imagePath.startsWith('http')
    ? imagePath
    : `${apiUrl}/uploads/${imagePath}`
}

const revokePreview = (previewUrl) => {
  if (previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl)
  }
}

const Categories = () => {
  const apiUrl = `${import.meta.env.VITE_API_URL}`
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingImage, setEditingImage] = useState(null)
  const [editingImagePreview, setEditingImagePreview] = useState('')
  const [updating, setUpdating] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)

    try {
      const response = await axios.get(`${apiUrl}/categories`)

      if (response.data.success && Array.isArray(response.data.data)) {
        setCategories(
          response.data.data.map((item) => ({
            ...item,
            imageUrl: resolveImageUrl(apiUrl, item.image),
          })),
        )
      } else {
        toast.error("Kategoriyalarni yuklab bo'lmadi")
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Kategoriyalarni yuklab bo'lmadi",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(
    () => () => {
      revokePreview(imagePreview)
      revokePreview(editingImagePreview)
    },
    [editingImagePreview, imagePreview],
  )

  const onImageChange = (event, variant) => {
    const selectedFile = event.target.files?.[0] ?? null

    if (variant === 'create') {
      revokePreview(imagePreview)
      setImage(selectedFile)
      setImagePreview(selectedFile ? URL.createObjectURL(selectedFile) : '')
      return
    }

    revokePreview(editingImagePreview)
    setEditingImage(selectedFile)
    setEditingImagePreview(
      selectedFile ? URL.createObjectURL(selectedFile) : editingCategory?.imageUrl ?? '',
    )
  }

  const resetCreateForm = () => {
    revokePreview(imagePreview)
    setName('')
    setImage(null)
    setImagePreview('')
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    if (!name.trim()) {
      toast.error('Kategoriya nomini kiriting')
      return
    }

    setCreating(true)

    try {
      const formData = new FormData()
      formData.append('name', name.trim())

      if (image) {
        formData.append('image', image)
      }

      const response = await axios.post(`${apiUrl}/categories`, formData)

      if (response.data.success) {
        toast.success(response.data.message)
        resetCreateForm()
        await fetchCategories()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Kategoriya qo'shib bo'lmadi",
      )
    } finally {
      setCreating(false)
    }
  }

  const openEditModal = (category) => {
    revokePreview(editingImagePreview)
    setEditingCategory(category)
    setEditingName(category.name)
    setEditingImage(null)
    setEditingImagePreview(category.imageUrl ?? '')
  }

  const closeEditModal = () => {
    revokePreview(editingImagePreview)
    setEditingCategory(null)
    setEditingName('')
    setEditingImage(null)
    setEditingImagePreview('')
  }

  const updateCategory = async (event) => {
    event.preventDefault()

    if (!editingCategory) {
      return
    }

    if (!editingName.trim()) {
      toast.error('Kategoriya nomini kiriting')
      return
    }

    setUpdating(true)

    try {
      const formData = new FormData()
      formData.append('name', editingName.trim())

      if (editingImage) {
        formData.append('image', editingImage)
      }

      const response = await axios.patch(
        `${apiUrl}/categories/${editingCategory.id}`,
        formData,
      )

      if (response.data.success) {
        toast.success(response.data.message)
        closeEditModal()
        await fetchCategories()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Kategoriyani yangilab bo'lmadi",
      )
    } finally {
      setUpdating(false)
    }
  }

  const removeCategory = async () => {
    if (!categoryToDelete) {
      return
    }

    setDeleting(true)

    try {
      const response = await axios.delete(
        `${apiUrl}/categories/${categoryToDelete.id}`,
      )

      if (response.data.success) {
        toast.success(response.data.message)
        setCategoryToDelete(null)
        await fetchCategories()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Kategoriyani o'chirib bo'lmadi",
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className='categories-page'>
        <section className='categories-form-card'>
          <div className='categories-form-copy'>
            <p className='categories-eyebrow'>Kategoriyalar</p>
            <h2>Yangi kategoriya qo&apos;shish</h2>
            <span>
              Taomlar bo&apos;limi uchun nom kiriting va xohlasangiz rasm
              biriktiring.
            </span>
          </div>

          <form className='categories-form' onSubmit={onSubmit}>
            <label className='categories-image-upload' htmlFor='category-image'>
              {imagePreview ? (
                <img src={imagePreview} alt='Kategoriya rasmi preview' />
              ) : (
                <span>
                  <FiImage />
                  <strong>Rasm yuklash</strong>
                  <small>JPG, PNG, WEBP</small>
                </span>
              )}
            </label>

            <input
              id='category-image'
              type='file'
              accept='.jpg,.jpeg,.png,.webp'
              hidden
              onChange={(event) => onImageChange(event, 'create')}
            />

            <div className='categories-form-fields'>
              <label className='categories-input-group'>
                <span>Kategoriya nomi</span>
                <input
                  type='text'
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder='Masalan: Ichimliklar'
                  maxLength={40}
                />
              </label>

              <p className='categories-form-helper'>
                Rasm ixtiyoriy. Rasm yuklanmasa, frontenddagi avvalgi default
                kategoriya ko&apos;rinishi ishlashda davom etadi.
              </p>

              <div className='categories-form-actions'>
                <button type='submit' disabled={creating}>
                  <FiPlus />
                  <span>{creating ? "Qo'shilmoqda..." : "Qo'shish"}</span>
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className='categories-list-card'>
          <div className='categories-list-head'>
            <div>
              <p className='categories-eyebrow'>Mavjud ro&apos;yxat</p>
              <h2>Kategoriyalar ro&apos;yxati</h2>
            </div>
            <span>{categories.length} ta kategoriya</span>
          </div>

          {loading ? <p className='categories-state'>Yuklanmoqda...</p> : null}

          {!loading && categories.length === 0 ? (
            <p className='categories-state'>
              Hozircha kategoriya yo&apos;q. Avval kategoriya qo&apos;shing.
            </p>
          ) : null}

          {!loading && categories.length > 0 ? (
            <div className='categories-grid'>
              {categories.map((category) => (
                <article key={category.id} className='category-card'>
                  <div className='category-card-main'>
                    {category.imageUrl ? (
                      <img
                        className='category-card-image'
                        src={category.imageUrl}
                        alt={category.name}
                      />
                    ) : (
                      <span className='category-card-icon'>
                        <FiTag />
                      </span>
                    )}
                    <div>
                      <strong>{category.name}</strong>
                      <p>{category.foodsCount} ta taom biriktirilgan</p>
                    </div>
                  </div>

                  <div className='category-card-actions'>
                    <button
                      type='button'
                      className='category-edit-btn'
                      onClick={() => openEditModal(category)}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      type='button'
                      className='category-delete-btn'
                      onClick={() => setCategoryToDelete(category)}
                      disabled={category.foodsCount > 0}
                      title={
                        category.foodsCount > 0
                          ? "Bu kategoriyada taomlar borligi uchun o'chirib bo'lmaydi"
                          : "Kategoriyani o'chirish"
                      }
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {editingCategory ? (
        <div className='delete-modal-overlay'>
          <div className='delete-modal edit-modal category-edit-modal'>
            <h3>Kategoriyani tahrirlash</h3>
            <form className='edit-modal-form' onSubmit={updateCategory}>
              <label>
                <span>Yangi nom</span>
                <input
                  type='text'
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  maxLength={40}
                />
              </label>

              <div className='edit-modal-field'>
                <span>Rasmni yangilash</span>
                <label
                  className='categories-image-upload edit'
                  htmlFor='edit-category-image'
                >
                  {editingImagePreview ? (
                    <img src={editingImagePreview} alt='Kategoriya rasmi preview' />
                  ) : (
                    <span>
                      <FiImage />
                      <strong>Yangi rasm tanlash</strong>
                      <small>JPG, PNG, WEBP</small>
                    </span>
                  )}
                </label>
                <input
                  id='edit-category-image'
                  type='file'
                  accept='.jpg,.jpeg,.png,.webp'
                  hidden
                  onChange={(event) => onImageChange(event, 'edit')}
                />
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

      {categoryToDelete ? (
        <div className='delete-modal-overlay'>
          <div className='delete-modal category-delete-modal'>
            <h3>Kategoriyani o&apos;chirish</h3>
            <p className='delete-modal-copy'>
              <span className='delete-modal-tag'>{categoryToDelete.name}</span>{' '}
              kategoriyasini rostan ham o&apos;chirishni xohlaysizmi?
            </p>
            <div className='delete-modal-actions'>
              <button
                type='button'
                className='delete-modal-btn cancel'
                onClick={() => setCategoryToDelete(null)}
                disabled={deleting}
              >
                Yo&apos;q
              </button>
              <button
                type='button'
                className='delete-modal-btn confirm'
                onClick={removeCategory}
                disabled={deleting}
              >
                {deleting ? "O'chirilmoqda..." : 'Ha'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Categories
