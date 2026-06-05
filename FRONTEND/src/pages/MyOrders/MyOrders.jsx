import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { StoreContext } from '../../Context/store-context'
import useRefreshOnActive from '../../hooks/useRefreshOnActive'
import { formatSom } from '../../utils/formatSom'
import './MyOrders.css'

const STATUS_LABELS = {
  Pending: 'Kutilmoqda',
  Confirmed: 'Qabul qilingan',
  Preparing: 'Tayyorlanmoqda',
  'Out for delivery': 'Yetkazilmoqda',
  Delivered: 'Yetkazildi',
  Cancelled: 'Bekor qilindi',
}

const STATUS_DESCRIPTIONS = {
  Pending: "Buyurtmangiz yuborildi va operator tomonidan ko'rib chiqilmoqda.",
  Confirmed: "Buyurtmangiz qabul qilindi va oshxonaga uzatildi.",
  Preparing: 'Taomingiz hozir tayyorlanmoqda.',
  'Out for delivery': "Buyurtmangiz yo'lga chiqdi.",
  Delivered: 'Buyurtma manzilingizga muvaffaqiyatli yetkazildi.',
  Cancelled: 'Buyurtma bekor qilingan.',
}

const STATUS_FLOW = ['Pending', 'Confirmed', 'Preparing', 'Out for delivery', 'Delivered']

const MyOrders = ({ setShowLogin }) => {
  const { apiUrl, token, user, getMyOrders } = useContext(StoreContext)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setErrorMessage('')
    }

    const result = await getMyOrders()

    if (!result.success) {
      if (!silent) {
        setErrorMessage(result.message)
        setOrders([])
      }

      if (!silent) {
        setLoading(false)
      }
      return
    }

    setOrders(result.data)
    if (!silent) {
      setLoading(false)
    }
  }, [getMyOrders])

  useEffect(() => {
    if (!user) {
      return
    }

    void loadOrders()
  }, [loadOrders, user])

  useRefreshOnActive(() => {
    if (!user) {
      return
    }

    void loadOrders({ silent: true })
  }, Boolean(user))

  useEffect(() => {
    if (!token || !user || typeof window === 'undefined' || !window.EventSource) {
      return undefined
    }

    const eventSource = new EventSource(
      `${apiUrl}/orders/me/stream?token=${encodeURIComponent(token)}`,
    )

    const handleOrdersUpdated = () => {
      void loadOrders({ silent: true })
    }

    eventSource.addEventListener('orders-updated', handleOrdersUpdated)

    return () => {
      eventSource.removeEventListener('orders-updated', handleOrdersUpdated)
      eventSource.close()
    }
  }, [apiUrl, loadOrders, token, user])

  const stats = useMemo(() => {
    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    )

    return {
      count: orders.length,
      totalSpent,
    }
  }, [orders])

  if (!user) {
    return (
      <div className="my-orders-page">
        <div className="account-empty-state">
          <h2>Buyurtmalarni ko&apos;rish uchun tizimga kiring</h2>
          <p>
            Profil menyusidagi buyurtmalar bo&apos;limi faqat ro&apos;yxatdan o&apos;tgan
            foydalanuvchilar uchun ishlaydi.
          </p>
          <button type="button" onClick={() => setShowLogin(true)}>
            Kirish oynasini ochish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="my-orders-page">
      <div className="my-orders-header">
        <div>
          <p className="my-orders-eyebrow">Mening kabinetim</p>
          <h1>Mening buyurtmalarim</h1>
          <p className="my-orders-subtitle">
            Berilgan barcha buyurtmalar holati va tafsilotlari shu yerda ko&apos;rinadi.
          </p>
        </div>
      </div>

      <div className="my-orders-stats">
        <div className="my-orders-stat-card">
          <span>Jami buyurtmalar</span>
          <strong>{stats.count}</strong>
        </div>
        <div className="my-orders-stat-card">
          <span>Jami xarajat</span>
          <strong>{formatSom(stats.totalSpent)}</strong>
        </div>
      </div>

      {loading ? <p className="my-orders-state">Buyurtmalar yuklanmoqda...</p> : null}
      {!loading && errorMessage ? (
        <p className="my-orders-state error">{errorMessage}</p>
      ) : null}
      {!loading && !errorMessage && orders.length === 0 ? (
        <p className="my-orders-state">Sizda hali buyurtmalar mavjud emas.</p>
      ) : null}

      {!loading && !errorMessage && orders.length > 0 ? (
        <div className="my-orders-list">
          {orders.map((order) => {
            const items = Array.isArray(order.items) ? order.items : []
            const statusStep = STATUS_FLOW.indexOf(order.status)
            const isCancelled = order.status === 'Cancelled'

            return (
              <article key={order.id} className="my-orders-card">
                <div className="my-orders-card-top">
                  <div>
                    <p className="my-orders-card-label">
                      Buyurtma #{order.id.slice(0, 8)}
                    </p>
                    <h3>{new Date(order.createdAt).toLocaleDateString()}</h3>
                    <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="my-orders-status-box">
                    <span
                      className={`my-orders-badge status-${order.status
                        .toLowerCase()
                        .replace(/[^a-z]+/g, '-')}`}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <p>{STATUS_DESCRIPTIONS[order.status] || "Holat yangilanmoqda."}</p>
                  </div>
                </div>

                {isCancelled ? (
                  <div className="my-orders-cancelled">
                    Buyurtma bekor qilingan. Zarur bo&apos;lsa yangi buyurtma berishingiz mumkin.
                  </div>
                ) : (
                  <div className="my-orders-progress">
                    {STATUS_FLOW.map((status, index) => {
                      const isCompleted = statusStep >= index
                      const isCurrent = order.status === status

                      return (
                        <div
                          key={status}
                          className={
                            isCurrent
                              ? 'my-orders-progress-step current'
                              : isCompleted
                                ? 'my-orders-progress-step completed'
                                : 'my-orders-progress-step'
                          }
                        >
                          <div className="my-orders-progress-dot" />
                          <span>{STATUS_LABELS[status]}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="my-orders-items">
                  {items.map((item) => (
                    <div key={item.foodId} className="my-orders-item">
                      <div>
                        <strong>{item.name}</strong>
                        <p>{item.category}</p>
                      </div>
                      <div className="my-orders-item-meta">
                        <span>{item.quantity} ta</span>
                        <strong>{formatSom(item.totalPrice)}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-orders-summary">
                  <div>
                    <span>Mahsulotlar</span>
                    <strong>{order.totalItems} ta</strong>
                  </div>
                  <div>
                    <span>Yetkazib berish</span>
                    <strong>{formatSom(order.deliveryFee)}</strong>
                  </div>
                  <div>
                    <span>Jami</span>
                    <strong>{formatSom(order.totalAmount)}</strong>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default MyOrders
