import { useEffect, useMemo, useState } from 'react'
import { Inbox } from 'lucide-react'
import { getOrders, updateOrderStatus, cancelOrder } from '../api/client'
import { connectOrdersWS } from '../api/ws'
import type { Order, OrderStatus } from '../types'
import OrderCard from '../components/OrderCard'
import StatusDropdown from '../components/StatusDropdown'
import StatusPill from '../components/StatusPill'
import PriceLabel from '../components/PriceLabel'
import LiveIndicator from '../components/LiveIndicator'
import Modal from '../components/Modal'
import Button from '../components/Button'
import { useToast } from '../components/Toast'

const orderColumns: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'completed',
]

export default function OrdersBoard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)
  const [showCancelled, setShowCancelled] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [socketState, setSocketState] = useState<'connected' | 'reconnecting' | 'offline'>('offline')
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    getOrders()
      .then((data) => {
        if (!mounted) return
        setOrders(data)
        setLoading(false)
      })
      .catch(() => mounted && setLoading(false))

    const ws = connectOrdersWS({
      onStatus: (s: string) => mounted && setSocketState(s as 'connected' | 'reconnecting' | 'offline'),
      onEvent: (event: string, order: Order) => {
        if (!order || !order.id) return
        if (event === 'order_created') {
          setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)])
          toast(`New order #${order.id} received!`)
        } else if (event === 'status_changed') {
          setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)))
          setSelected((s) => (s?.id === order.id ? order : s))
        }
      },
    })

    return () => {
      mounted = false
      ws.close()
    }
  }, [])

  const byColumn = useMemo(() => {
    const map: Record<string, Order[]> = {}
    orderColumns.forEach((c) => (map[c] = []))
    orders
      .filter((o) => o.status !== 'cancelled')
      .forEach((o) => map[o.status]?.push(o))
    return map
  }, [orders])

  const cancelledOrders = useMemo(
    () => orders.filter((o) => o.status === 'cancelled'),
    [orders]
  )

  async function moveStatus(orderId: number, status: OrderStatus) {
    try {
      const updated = await updateOrderStatus(orderId, status)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      setSelected((s) => (s?.id === orderId ? updated : s))
      toast(`Order #${orderId} moved to ${status.replace(/_/g, ' ')} ✓`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update order status.', 'error')
    }
  }

  async function handleCancel(orderId: number) {
    if (!cancelReason.trim()) {
      toast('Please enter a cancel reason before cancelling.', 'error')
      return
    }
    try {
      const updated = await cancelOrder(orderId, cancelReason)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)))
      setSelected(null)
      setCancelReason('')
      toast(`Order #${orderId} cancelled.`, 'info')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to cancel order.', 'error')
    }
  }

  const selectedDetail = orders.find((o) => o.id === selected?.id) || null

  return (
    <>
      <div className="page-heading board-heading">
        <div>
          <h1>Orders Board</h1>
          <p>Live order tracking. New orders arrive in real time.</p>
        </div>
        <div className="board-toolbar">
          <LiveIndicator state={socketState} />
          <Button variant="secondary" onClick={() => setShowCancelled(true)}>
            Cancelled ({cancelledOrders.length})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="card">Loading orders…</div>
      ) : (
        <div className="kanban">
          {orderColumns.map((col) => (
            <div className="kanban-col" key={col}>
              <div className="kanban-col-title">
                <StatusPill status={col} />
                <span className="kanban-count">{byColumn[col].length}</span>
              </div>
              <div className="kanban-col-body">
                {byColumn[col].map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    newPulse={true}
                    onClick={() => setSelected(o)}
                  />
                ))}
                {byColumn[col].length === 0 && (
                  <div className="kanban-empty">
                    <Inbox size={18} />
                    <span>No {col.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDetail && (
        <Modal
          title={`Order #${selectedDetail.id}`}
          onClose={() => setSelected(null)}
          footer={
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
          }
        >
          <div className="order-detail">
            <div className="detail-row">
              <StatusPill status={selectedDetail.status} />
              <span className="muted">{selectedDetail.order_type}</span>
            </div>
            {selectedDetail.customer_name && (
              <p>
                <strong>Customer:</strong> {selectedDetail.customer_name}{' '}
                {selectedDetail.customer_phone && <span className="muted">({selectedDetail.customer_phone})</span>}
              </p>
            )}
            {selectedDetail.delivery_address && (
              <p>
                <strong>Deliver to:</strong> {selectedDetail.delivery_address}
              </p>
            )}
            <div className="detail-items">
              <strong>Items</strong>
              {selectedDetail.items.map((it) => (
                <div key={it.id} className="detail-item">
                  <div>
                    <div>
                      {it.quantity}× {it.item_name_en}{' '}
                      <span className="muted">({it.item_name_ar})</span>
                    </div>
                    {it.bundled && (
                      <ul className="bundled-list">
                        {it.bundled.map((b, i) => (
                          <li key={i}>
                            {b.quantity}× {b.name_en}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <PriceLabel value={it.unit_price * it.quantity} />
                </div>
              ))}
              <div className="detail-total">
                <span>Total</span>
                <PriceLabel value={selectedDetail.total} />
              </div>
            </div>

            {selectedDetail.status !== 'cancelled' ? (
              <div className="detail-actions">
                <StatusDropdown
                  current={selectedDetail.status}
                  orderType={selectedDetail.order_type}
                  onChange={(s) => moveStatus(selectedDetail.id, s)}
                />
                {(selectedDetail.status === 'pending' || selectedDetail.status === 'preparing') && (
                  <div className="cancel-box">
                    <input
                      placeholder="Cancel reason…"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <Button variant="danger" onClick={() => handleCancel(selectedDetail.id)}>
                      Cancel Order
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="form-error">
                Cancelled: {selectedDetail.cancel_reason}
              </div>
            )}
          </div>
        </Modal>
      )}

      {showCancelled && (
        <Modal
          title="Cancelled Orders"
          onClose={() => setShowCancelled(false)}
          footer={
            <Button variant="secondary" onClick={() => setShowCancelled(false)}>
              Close
            </Button>
          }
        >
          <div className="cancelled-list">
            {cancelledOrders.map((o) => (
              <div className="card cancelled-item" key={o.id}>
                <div>
                  <strong>#{o.id}</strong> — {o.customer_name || 'Walk-in'}
                  <div className="muted">{o.cancel_reason || 'No reason provided'}</div>
                </div>
                <StatusPill status="cancelled" />
              </div>
            ))}
            {cancelledOrders.length === 0 && <div className="muted">No cancelled orders.</div>}
          </div>
        </Modal>
      )}
    </>
  )
}
