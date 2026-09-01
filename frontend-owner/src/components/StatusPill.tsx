import type { OrderStatus } from '../types'

const LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const ARABIC: Record<OrderStatus, string> = {
  pending: 'في الانتظار',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  out_for_delivery: 'في الطريق',
  delivered: 'تم التوصيل',
  completed: 'مكتمل',
  cancelled: 'ملغي',
}

export default function StatusPill({
  status,
  lang = 'en',
}: {
  status: OrderStatus
  lang?: 'en' | 'ar'
}) {
  return <span className={`status-pill status-${status}`}>{lang === 'ar' ? ARABIC[status] : LABELS[status]}</span>
}
