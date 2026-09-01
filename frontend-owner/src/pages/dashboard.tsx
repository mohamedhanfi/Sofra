import { useEffect, useState } from 'react'
import { getOrders } from '../api/client'
import StatusPill from '../components/StatusPill'
import PriceLabel from '../components/PriceLabel'
import type { Order, OrderStatus } from '../types'

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getOrders()
      .then((data) => mounted && setOrders(data))
      .catch(() => mounted && setOrders([]))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const active = orders.filter((o) => o.status !== 'cancelled')
  const counts = active.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})
  const revenue = active.reduce((sum, o) => sum + o.total, 0)
  const today = active.filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString()
  )

  if (loading) {
    return <div className="card">Loading dashboard…</div>
  }

  return (
    <>
      <div className="page-heading">
        <h1>Today's Snapshot</h1>
        <p>Quick overview of today's orders and performance.</p>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{active.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Revenue (Today)</div>
          <div className="stat-value">
            <PriceLabel value={revenue} />
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Avg Order Value</div>
          <div className="stat-value">
            <PriceLabel value={revenue / Math.max(active.length, 1)} />
          </div>
        </div>
      </div>

      <div className="dash-section">
        <h2>Orders by Status</h2>
        <div className="stats-grid">
          {(Object.keys(statusLabels) as OrderStatus[])
            .filter((s) => s !== 'cancelled')
            .map((s) => (
              <div className="card stat-card" key={s}>
                <div className="stat-label">{statusLabels[s]}</div>
                <div className="stat-value">{counts[s] || 0}</div>
                <StatusPill status={s} />
              </div>
            ))}
        </div>
      </div>

      <div className="dash-section">
        <h2>Recent Orders</h2>
        <div className="dash-order-list">
          {today.length === 0 && <div className="card">No orders today yet.</div>}
          {today.slice(0, 5).map((o) => (
            <div className="card" key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <strong>#{o.id}</strong> — {o.customer_name || 'Walk-in'} ({o.order_type})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PriceLabel value={o.total} />
                <StatusPill status={o.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
