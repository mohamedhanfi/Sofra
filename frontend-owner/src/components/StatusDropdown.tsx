import type { OrderStatus } from '../types'

const OPTIONS: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'completed',
]

const LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
}

export default function StatusDropdown({
  current,
  orderType,
  onChange,
}: {
  current: OrderStatus
  orderType: 'delivery' | 'pickup'
  onChange: (next: OrderStatus) => void
}) {
  const allowed = OPTIONS.filter((o) =>
    o === 'out_for_delivery' || o === 'delivered' ? orderType === 'delivery' : true
  ).filter((o) => o !== current)

  const quickNext = NEXT[current]
  const quickAllowed =
    orderType === 'pickup' && quickNext === 'out_for_delivery'
      ? 'completed'
      : quickNext

  return (
    <div className="status-dropdown">
      <button className="btn btn-secondary status-advance" onClick={() => onChange(quickAllowed!)}>
        Advance →
      </button>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        className="status-select"
      >
        <option value={current}>{LABELS[current]}</option>
        {allowed.map((o) => (
          <option key={o} value={o}>
            {LABELS[o]}
          </option>
        ))}
      </select>
    </div>
  )
}
