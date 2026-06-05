import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import useRefreshOnActive from '../../hooks/useRefreshOnActive'
import { formatSom } from '../../utils/formatSom'
import './Dashboard.css'

const chartColors = ['#ff6b4a', '#ff9a7a', '#ffc16f', '#7c8efc', '#b098ff', '#ff96b3']

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const url = `${import.meta.env.VITE_API_URL}`

  const fetchStats = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
    }

    try {
      const response = await axios.get(`${url}/dashboard/stats`)

      if (response.data.success) {
        setStats(response.data.data)
      } else {
        if (!silent) {
          toast.error("Statistikalarni yuklashda xatolik yuz berdi")
        }
      }
    } catch (error) {
      if (!silent) {
        toast.error(
          error.response?.data?.message ||
            "Statistikalarni yuklashda xatolik yuz berdi",
        )
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [url])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  useRefreshOnActive(() => {
    void fetchStats({ silent: true })
  })

  const categoryData = stats?.charts?.foodsByCategory ?? []
  const roleData = stats?.charts?.usersByRole ?? []
  const monthlyRevenueTrend = stats?.charts?.monthlyRevenueTrend ?? []
  const recentFoods = stats?.recentFoods ?? []
  const summary = stats?.summary ?? {}

  const maxCategoryValue = Math.max(...categoryData.map((item) => item.value), 1)
  const maxMonthlyRevenue = Math.max(...monthlyRevenueTrend.map((item) => item.value), 1)
  const metricCards = [
    {
      label: 'Jami foydalanuvchilar',
      value: summary.totalUsers ?? 0,
      tone: 'slate',
    },
    {
      label: 'Jami buyurtmalar',
      value: summary.totalOrders ?? 0,
      tone: 'sand',
    },
    {
      label: 'Sotilgan mahsulotlar',
      value: summary.totalSoldItems ?? 0,
      tone: 'mint',
    },
    {
      label: 'Umumiy daromad',
      value: formatSom(summary.totalRevenue),
      tone: 'ink',
    },
    {
      label: 'Oylik daromad',
      value: formatSom(summary.monthlyRevenue),
      tone: 'peach',
    },
    {
      label: 'Yillik daromad',
      value: formatSom(summary.yearlyRevenue),
      tone: 'violet',
    },
  ]
  const heroHighlights = [
    {
      label: 'Taomlar',
      value: summary.totalFoods ?? 0,
    },
    {
      label: 'Kategoriyalar',
      value: summary.totalCategories ?? 0,
    },
    {
      label: "O'rtacha narx",
      value: formatSom(summary.averageFoodPrice),
    },
  ]

  const roleGradient = useMemo(() => {
    const total = roleData.reduce((sum, item) => sum + item.value, 0)

    if (!total) {
      return '#ececec'
    }

    let current = 0
    const segments = roleData.map((item, index) => {
      const start = current
      const angle = (item.value / total) * 360
      current += angle
      return `${chartColors[index % chartColors.length]} ${start}deg ${current}deg`
    })

    return `conic-gradient(${segments.join(', ')})`
  }, [roleData])

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <div className="dashboard-hero-top">
        <div>
          <p className="dashboard-eyebrow">Ikki Do&apos;st Admin</p>
          <h1>Umumiy statistika</h1>
          <p className="dashboard-subtitle">
            Menyu, mijozlar va buyurtmalar bo&apos;yicha eng muhim ko&apos;rsatkichlar bitta oynada jamlandi.
          </p>
        </div>
      </div>
        <div className="dashboard-hero-highlights">
          {heroHighlights.map((item) => (
            <div key={item.label} className="dashboard-highlight">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {loading && <p className="dashboard-state">Statistikalar yuklanmoqda...</p>}

      {!loading && stats && (
        <>
          <div className="dashboard-cards">
            {metricCards.map((card) => (
              <div key={card.label} className={`dashboard-card tone-${card.tone}`}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
            ))}
          </div>

          <div className="dashboard-layout">
            <div className="dashboard-main">
              <section className="dashboard-panel">
                <div className="panel-header">
                  <div>
                    <p className="panel-kicker">Daromad</p>
                    <h3>Oylik daromad</h3>
                  </div>
                  <p>Joriy yil bo&apos;yicha oyma-oy daromad</p>
                </div>

                {monthlyRevenueTrend.every((item) => item.value === 0) ? (
                  <p className="dashboard-state">Hozircha daromad ma&apos;lumotlari yo&apos;q.</p>
                ) : (
                  <div className="monthly-revenue-chart">
                    {monthlyRevenueTrend.map((item, index) => (
                      <div key={item.label} className="monthly-bar-card">
                        <div className="monthly-bar-track">
                          <div
                            className="monthly-bar-fill"
                            style={{
                              height: `${(item.value / maxMonthlyRevenue) * 100}%`,
                              background: chartColors[index % chartColors.length],
                            }}
                          />
                        </div>
                        <span>{item.label}</span>
                        <strong>{formatSom(item.value)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="dashboard-panel">
                <div className="panel-header">
                  <div>
                    <p className="panel-kicker">Taomlar</p>
                    <h3>Kategoriyalar bo&apos;yicha taqsimot</h3>
                  </div>
                  <p>Kategoriya bo&apos;yicha taqsimot</p>
                </div>

                {categoryData.length === 0 ? (
                  <p className="dashboard-state">Hozircha taom ma&apos;lumotlari yo&apos;q.</p>
                ) : (
                  <div className="bar-chart">
                    {categoryData.map((item, index) => (
                      <div key={item.label} className="bar-row">
                        <div className="bar-label-wrap">
                          <span
                            className="bar-dot"
                            style={{ backgroundColor: chartColors[index % chartColors.length] }}
                          />
                          <span className="bar-label">{item.label}</span>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${(item.value / maxCategoryValue) * 100}%`,
                              background: chartColors[index % chartColors.length],
                            }}
                          />
                        </div>
                        <strong className="bar-value">{item.value}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="dashboard-side">
              <section className="dashboard-panel compact-panel">
                <div className="panel-header">
                  <div>
                    <p className="panel-kicker">Rollar</p>
                    <h3>Foydalanuvchilar rollari</h3>
                  </div>
                  <p>Foydalanuvchi rollari statistikasi</p>
                </div>

                {roleData.length === 0 ? (
                  <p className="dashboard-state">Hozircha foydalanuvchi ma&apos;lumotlari yo&apos;q.</p>
                ) : (
                  <div className="role-chart-wrap">
                    <div
                      className="role-donut"
                      style={{ backgroundImage: roleGradient }}
                    >
                      <div className="role-donut-center">
                        <span>Userlar</span>
                        <strong>{summary.totalUsers ?? 0}</strong>
                      </div>
                    </div>

                    <div className="role-legend">
                      {roleData.map((item, index) => (
                        <div key={item.label} className="legend-item">
                          <span
                            className="legend-dot"
                            style={{ backgroundColor: chartColors[index % chartColors.length] }}
                          />
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="dashboard-panel compact-panel recent-panel">
                <div className="panel-header">
                  <div>
                    <p className="panel-kicker">Yangi</p>
                    <h3>So&apos;nggi qo&apos;shilgan taomlar</h3>
                  </div>
                  <p>Oxirgi qo&apos;shilgan mahsulotlar</p>
                </div>

                {recentFoods.length === 0 ? (
                  <p className="dashboard-state">Yangi qo&apos;shilgan mahsulotlar yo&apos;q.</p>
                ) : (
                  <div className="recent-foods">
                    {recentFoods.map((food) => (
                      <div key={food.id} className="recent-food-card">
                        <div className="recent-food-content">
                          <strong>{food.name}</strong>
                          <p>{food.category}</p>
                        </div>
                        <div className="recent-food-meta">
                          <strong>{formatSom(food.price)}</strong>
                          <span>{new Date(food.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
