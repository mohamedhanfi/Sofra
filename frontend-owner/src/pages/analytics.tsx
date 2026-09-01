import { useEffect, useState } from 'react'
import { getAnalytics } from '../api/client'
import type { AnalyticsPeriod, AnalyticsResponse } from '../api/client'
import PriceLabel from '../components/PriceLabel'
import AnalyticsChart from '../components/AnalyticsChart'

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
]

export default function Analytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d')
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getAnalytics(period)
      .then((d) => mounted && setData(d))
      .catch(() => mounted && setData(null))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [period])

  return (
    <>
      <div className="page-heading analytics-heading">
        <div>
          <h1>Analytics</h1>
          <p>Sales and performance insights.</p>
        </div>
        <div className="period-toggle">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={`period-btn ${period === p.key ? 'active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="card">Loading analytics…</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="card stat-card">
              <div className="stat-label">Orders</div>
              <div className="stat-value">{data.order_count}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Revenue</div>
              <div className="stat-value">
                <PriceLabel value={data.revenue} />
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Avg Order Value</div>
              <div className="stat-value">
                <PriceLabel value={data.avg_order_value} />
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Avg Rating</div>
              <div className="stat-value">
                {data.avg_rating.toFixed(1)} <span className="stars">★</span>
              </div>
            </div>
          </div>

          <div className="analytics-charts">
            <div className="card">
              <h3 className="chart-title">Top 5 Items</h3>
              <AnalyticsChart
                data={data.top_items.map((t) => ({ label: t.name, value: t.quantity }))}
              />
            </div>
            <div className="card">
              <h3 className="chart-title">Orders by Hour</h3>
              <AnalyticsChart
                data={data.peak_hours.map((p) => ({
                  label: `${p.hour}:00`,
                  value: p.order_count,
                }))}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
