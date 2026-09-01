import type { Order } from '../types'

export function connectOrdersWS(options: {
  onEvent?: (event: 'order_created' | 'status_changed', order: Order) => void
  onStatus?: (status: 'connected' | 'reconnecting' | 'offline') => void
}): { close: () => void }
