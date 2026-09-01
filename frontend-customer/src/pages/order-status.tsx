import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useLang } from '../context/LangContext'
import { getOrderStatus, rateOrder, connectOrderStatusWS } from '../api/client'
import type { OrderDetail, OrderStatus } from '../types'
import PriceLabel from '../components/PriceLabel'
import FoodPlaceholder from '../components/FoodPlaceholder'
import RatingStars from '../components/RatingStars'

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'في الانتظار' },
  preparing: { en: 'Preparing', ar: 'قيد التحضير' },
  ready: { en: 'Ready', ar: 'جاهز' },
  out_for_delivery: { en: 'Out for Delivery', ar: 'في الطريق' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
}

const statusOrder: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
]

export default function OrderStatus() {
  const { id: _id } = useParams()
  const { lang, t } = useLang()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    try {
      const data = await getOrderStatus()
      setOrder(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order')
    }
  }, [])

  useEffect(() => {
    fetchOrder()
    const timer = setInterval(fetchOrder, 15000)
    const socket = connectOrderStatusWS((event, live) => {
      if (event === 'status_changed') {
        setOrder((prev) => ({ ...live, rating: live.rating ?? prev?.rating }))
        setError(null)
      }
    })
    return () => {
      clearInterval(timer)
      socket.close()
    }
  }, [fetchOrder])

  if (error) {
    return (
      <div className="status-page">
        <p>{error}</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="status-page">
        <p>{t('Loading...', 'جاري التحميل...')}</p>
      </div>
    )
  }

  const currentIdx = statusOrder.indexOf(order.status)
  const done = order.status === 'delivered' || order.status === 'completed'

  async function handleRate(stars: number, comment?: string) {
    if (!order) return
    try {
      await rateOrder(order.id, stars, comment)
    } catch {
      // silently fail
    }
  }

  return (
    <div className="status-page">
      <h1>
        {t('Order', 'طلب')} #{order.id}
      </h1>

      <div className="stepper">
        {statusOrder.map((s, i) => (
          <div
            key={s}
            className={`step${i <= currentIdx ? ' done' : ''}${
              i === currentIdx ? ' current' : ''
            }`}
          >
            <div className="step-dot">
              {i <= currentIdx ? <Check /> : i + 1}
            </div>
            <span className="step-label">{t(STATUS_LABELS[s].en, STATUS_LABELS[s].ar)}</span>
            {i < statusOrder.length - 1 && <div className="step-line" />}
          </div>
        ))}
      </div>

      <div className="status-detail card">
        <div className="status-detail-head">
          <span className={`badge-type ${order.order_type}`}>
            {t(order.order_type === 'delivery' ? 'Delivery' : 'Pickup' , order.order_type === 'delivery' ? 'توصيل' : 'استلام')}
          </span>
          <PriceLabel value={order.total} />
        </div>
        <div className="status-items">
          {order.items.map((it) => (
            <div className="status-item" key={it.id}>
              <span className="status-item-name">
                <FoodPlaceholder size="sm" className="cart-line-thumb" />
                <span>
                  {it.quantity}× {lang === 'ar' ? it.item_name_ar : it.item_name_en}
                </span>
              </span>
              <PriceLabel value={it.unit_price * it.quantity} />
            </div>
          ))}
          <div className="status-item total">
            <span>{t('Total', 'الإجمالي')}</span>
            <PriceLabel value={order.total} />
          </div>
        </div>
      </div>

      {!done && (
        <div className="status-polling">
          <span className="poll-dot" />
          {t(
            'Auto-refreshing every 15 seconds…',
            'بيتحدث كل 15 ثانية…'
          )}
        </div>
      )}

      {done && <RatingStars orderId={order.id} onSubmitted={handleRate} />}
    </div>
  )
}
