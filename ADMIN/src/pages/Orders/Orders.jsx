import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import useRefreshOnActive from '../../hooks/useRefreshOnActive'
import { getAdminToken } from '../../utils/adminAuth'
import { formatSom } from '../../utils/formatSom'
import './Orders.css'

const ORDER_STATUSES = [
  { value: 'Pending', label: 'Kutilmoqda' },
  { value: 'Confirmed', label: 'Qabul qilingan' },
  { value: 'Preparing', label: 'Tayyorlanmoqda' },
  { value: 'Out for delivery', label: 'Yetkazilmoqda' },
  { value: 'Delivered', label: 'Yetkazildi' },
  { value: 'Cancelled', label: 'Bekor qilindi' },
]

const getOrderStatusTone = (status) =>
  ({
    Pending: 'new',
    Confirmed: 'accepted',
    Preparing: 'preparing',
    'Out for delivery': 'delivery',
    Delivered: 'delivered',
    Cancelled: 'cancelled',
  })[status] || 'default'

const getLegacyStreetLocation = (street = '') => {
  const match = String(street).match(
    /Lokatsiya:\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
  )

  if (!match) {
    return null
  }

  const lat = Number(match[1])
  const lng = Number(match[2])

  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

const getCleanStreet = (street = '') =>
  String(street).replace(/\s*\|\s*(Izoh|Lokatsiya):.*$/i, '').trim()

const getLegacyNote = (street = '') => {
  const match = String(street).match(/Izoh:\s*(.*?)(?:\s*\|\s*Lokatsiya:|$)/i)

  return match?.[1]?.trim() || ''
}

const getUniqueAddressParts = (...parts) => {
  const seen = new Set()

  return parts.filter((part) => {
    const value = String(part || '').trim()
    const key = value.toLowerCase()

    if (!value || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

const getMapDestination = ({ address, lat, lng }) => {
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng)

  if (hasCoordinates) {
    return {
      hasCoordinates,
      lat,
      lng,
      text: `${lat},${lng}`,
    }
  }

  return {
    hasCoordinates,
    text: getUniqueAddressParts(
      getCleanStreet(address.street),
      address.city,
      address.state,
    ).join(', '),
  }
}

const getGoogleDestination = (destination) =>
  destination.hasCoordinates ? `${destination.lat},${destination.lng}` : destination.text

const getYandexDestination = (destination) =>
  destination.hasCoordinates ? `${destination.lat},${destination.lng}` : destination.text

const buildRouteLinks = ({ destination, origin }) => {
  if (!destination?.text || !origin) {
    return null
  }

  const googleOrigin = encodeURIComponent(`${origin.lat},${origin.lng}`)
  const googleDestination = encodeURIComponent(getGoogleDestination(destination))
  const yandexOrigin = `${origin.lat},${origin.lng}`
  const yandexDestination = getYandexDestination(destination)

  return {
    google: `https://www.google.com/maps/dir/?api=1&origin=${googleOrigin}&destination=${googleDestination}&travelmode=driving`,
    yandex: `https://yandex.com/maps/?rtext=${encodeURIComponent(`${yandexOrigin}~${yandexDestination}`)}&rtt=auto`,
  }
}

const Orders = () => {
  const url = `${import.meta.env.VITE_API_URL}`
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState('')
  const [mapChoice, setMapChoice] = useState(null)
  const [locatingProvider, setLocatingProvider] = useState('')

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
    }

    try {
      const response = await axios.get(`${url}/orders/admin`)

      if (response.data.success && Array.isArray(response.data.data)) {
        setOrders(response.data.data)
      } else {
        if (!silent) {
          toast.error("Buyurtmalarni yuklashda xatolik yuz berdi")
        }
      }
    } catch (error) {
      if (!silent) {
        toast.error(
          error.response?.data?.message ||
            "Buyurtmalarni yuklashda xatolik yuz berdi",
        )
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [url])

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrderId(orderId)

    try {
      const response = await axios.patch(`${url}/orders/${orderId}/status`, {
        status,
      })

      if (response.data.success) {
        toast.success(response.data.message)
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status } : order,
          ),
        )
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Buyurtma statusini yangilashda xatolik yuz berdi",
      )
    } finally {
      setUpdatingOrderId('')
    }
  }

  const openMapChoice = (destination) => {
    setMapChoice(destination)
  }

  const closeMapChoice = () => {
    setLocatingProvider('')
    setMapChoice(null)
  }

  const openSelectedMap = (provider) => {
    if (!mapChoice || locatingProvider) {
      return
    }

    if (!navigator.geolocation) {
      toast.error("Brauzeringiz lokatsiya aniqlashni qo'llab-quvvatlamaydi")
      return
    }

    setLocatingProvider(provider)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const routeLinks = buildRouteLinks({
          destination: mapChoice,
          origin: {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
          },
        })
        const mapUrl = routeLinks?.[provider]

        if (!mapUrl) {
          toast.error("Marshrut havolasini yaratib bo'lmadi")
          setLocatingProvider('')
          return
        }

        const mapWindow = window.open(mapUrl, '_blank', 'noopener,noreferrer')

        if (mapWindow) {
          mapWindow.opener = null
        }

        closeMapChoice()
      },
      () => {
        toast.error(
          "Marshrut chizish uchun brauzerda lokatsiyaga ruxsat bering",
        )
        setLocatingProvider('')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    )
  }

  useEffect(() => {
    void fetchOrders()
  }, [fetchOrders])

  useRefreshOnActive(() => {
    void fetchOrders({ silent: true })
  })

  useEffect(() => {
    const token = getAdminToken()

    if (!token || typeof window === 'undefined' || !window.EventSource) {
      return undefined
    }

    const eventSource = new EventSource(
      `${url}/orders/admin/stream?token=${encodeURIComponent(token)}`,
    )

    const handleOrdersUpdated = () => {
      void fetchOrders({ silent: true })
    }

    eventSource.addEventListener('orders-updated', handleOrdersUpdated)

    return () => {
      eventSource.removeEventListener('orders-updated', handleOrdersUpdated)
      eventSource.close()
    }
  }, [fetchOrders, url])

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <p className="orders-eyebrow">Buyurtmalar</p>
          <h2>Barcha mijoz buyurtmalari</h2>
        </div>
      </div>

      <div className="orders-table">
        <div className="orders-table-row orders-table-title">
          <b>Buyurtma</b>
          <b>Mijoz</b>
          <b>Mahsulotlar</b>
          <b>Summa</b>
          <b>Holat</b>
          <b>Sana</b>
          <b>Amal</b>
        </div>

        {loading && <p className="orders-state">Buyurtmalar yuklanmoqda...</p>}

        {!loading && orders.length === 0 && (
          <p className="orders-state">Hozircha buyurtmalar yo&apos;q.</p>
        )}

        {!loading &&
          orders.length > 0 &&
          orders.map((order) => {
            const items = Array.isArray(order.items) ? order.items : []
            const address =
              order.address && typeof order.address === 'object'
                ? order.address
                : {}
            const location =
              address.location && typeof address.location === 'object'
                ? address.location
                : null
            const legacyLocation = getLegacyStreetLocation(address.street)
            const locationLat = Number(location?.lat ?? legacyLocation?.lat)
            const locationLng = Number(location?.lng ?? legacyLocation?.lng)
            const mapDestination = getMapDestination({
              address,
              lat: locationLat,
              lng: locationLng,
            })
            const cleanStreet = getCleanStreet(address.street)
            const note = address.note || getLegacyNote(address.street)
            const cityLine = getUniqueAddressParts(address.city, address.state)
            const customerName =
              order.user?.name ||
              `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
              'Mijoz'
            const itemsPreview = items
              .slice(0, 2)
              .map((item) => `${item.name} x${item.quantity}`)
              .join(', ')
            const isExpanded = expandedOrderId === order.id
            const statusTone = getOrderStatusTone(order.status)

            return (
              <div key={order.id} className="orders-table-entry">
                <div className={`orders-table-row order-row--${statusTone}`}>
                  <div className="orders-order-cell">
                    <strong>#{order.id.slice(0, 8)}</strong>
                    <span>{order.totalItems} ta mahsulot</span>
                  </div>

                  <div className="orders-customer-cell">
                    <strong>{customerName}</strong>
                    <span>{address.phone || order.user?.email || address.email || "Aloqa yo'q"}</span>
                  </div>

                  <div className="orders-items-cell">
                    <strong>{itemsPreview || "Mahsulot yo'q"}</strong>
                    <span>
                      {items.length > 2
                        ? `+${items.length - 2} ta yana`
                        : `${items.length} ta tur`}
                    </span>
                  </div>

                  <div className="orders-amount-cell">
                    <strong>{formatSom(order.totalAmount)}</strong>
                    <span>Yetkazib berish: {formatSom(order.deliveryFee)}</span>
                  </div>

                  <div className="orders-status-cell">
                    <select
                      className={`order-status-select order-status-select--${statusTone}`}
                      value={order.status}
                      onChange={(event) =>
                        updateOrderStatus(order.id, event.target.value)
                      }
                      disabled={updatingOrderId === order.id}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="orders-date-cell">
                    <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                    <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                  </div>

                  <div className="orders-action-cell">
                    <button
                      type="button"
                      className="orders-details-btn"
                      onClick={() =>
                        setExpandedOrderId(isExpanded ? '' : order.id)
                      }
                    >
                      {isExpanded ? 'Yopish' : 'Batafsil'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="orders-details-panel">
                    <div className="orders-detail-block">
                      <p className="orders-detail-title">Mahsulotlar</p>
                      <div className="orders-detail-list">
                        {items.map((item) => (
                          <div key={item.foodId} className="orders-detail-row">
                            <span>{item.name}</span>
                            <span>
                              {item.quantity} x {formatSom(item.unitPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="orders-detail-block">
                      <p className="orders-detail-title">Yetkazish</p>
                      <div className="orders-address">
                        <p>
                          {address.firstName} {address.lastName}
                        </p>
                        {cleanStreet ? <p>{cleanStreet}</p> : null}
                        {cityLine.length ? <p>{cityLine.join(', ')}</p> : null}
                        {address.phone ? <p>{address.phone}</p> : null}
                        {note ? <p className="orders-address-note">Izoh: {note}</p> : null}
                        {mapDestination.text ? (
                          <div className="orders-location-actions">
                            <button
                              type="button"
                              className="orders-location-link"
                              onClick={() => openMapChoice(mapDestination)}
                            >
                              Mijoz manzili
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="orders-detail-block">
                      <p className="orders-detail-title">Hisobot</p>
                      <div className="orders-summary">
                        <div className="orders-detail-row">
                          <span>Mahsulotlar</span>
                          <strong>{order.totalItems}</strong>
                        </div>
                        <div className="orders-detail-row">
                          <span>Oraliq summa</span>
                          <strong>{formatSom(order.subtotal)}</strong>
                        </div>
                        <div className="orders-detail-row">
                          <span>Yetkazib berish</span>
                          <strong>{formatSom(order.deliveryFee)}</strong>
                        </div>
                        <div className="orders-detail-row">
                          <span>Jami</span>
                          <strong>{formatSom(order.totalAmount)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {mapChoice ? (
        <div className="map-choice-overlay" role="presentation">
          <div className="map-choice-modal" role="dialog" aria-modal="true">
            <h3>Xaritani tanlang</h3>
            <p>Mijoz manzilini qaysi xaritada ochamiz?</p>
            <div className="map-choice-actions">
              <button
                type="button"
                onClick={() => openSelectedMap('google')}
                disabled={Boolean(locatingProvider)}
              >
                {locatingProvider === 'google'
                  ? 'Lokatsiya olinmoqda...'
                  : 'Google Maps'}
              </button>
              <button
                type="button"
                onClick={() => openSelectedMap('yandex')}
                disabled={Boolean(locatingProvider)}
              >
                {locatingProvider === 'yandex'
                  ? 'Lokatsiya olinmoqda...'
                  : 'Yandex Maps'}
              </button>
              <button
                type="button"
                className="cancel"
                onClick={closeMapChoice}
                disabled={Boolean(locatingProvider)}
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Orders
