import { Truck, Package } from 'lucide-react'
import type { Order } from '../types'
import StatusPill from './StatusPill'
import PriceLabel from './PriceLabel'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${mins % 60}m ago`
}

export default function OrderCard({
  order,
  newPulse = false,
  onClick,
}: {
  order: Order
  newPulse?: boolean
  onClick?: () => void
}) {
  const isNew = newPulse && order.status === 'pending'
  const TypeIcon = order.order_type === 'delivery' ? Truck : Package

  return (
    <div
      className={`order-card${isNew ? ' order-new' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="order-card-top">
        <strong>#{order.id}</strong>
        <span className="order-type">
          <TypeIcon size={12} />
          {order.order_type}
        </span>
      </div>
      <div className="order-customer">
        {order.customer_name || 'Walk-in'}
        {order.customer_phone && <span className="muted"> · {order.customer_phone}</span>}
      </div>
      <div className="order-summary">
        {order.items.map((it) => (
          <div key={it.id} className="order-line">
            <span>
              {it.quantity}× {it.item_name_en}
            </span>
            <PriceLabel value={it.unit_price * it.quantity} />
          </div>
        ))}
      </div>
      <div className="order-card-bottom">
        <div className="order-total">
          Total <PriceLabel value={order.total} />
        </div>
        <div className="order-meta">
          <StatusPill status={order.status} />
          <span className="muted">{timeAgo(order.created_at)}</span>
        </div>
      </div>
    </div>
  )
}
