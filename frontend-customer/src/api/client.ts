import type { MenuItem, Combo, CartLine, CartTotal, OrderDetail } from '../types'

const BASE_URL = 'http://127.0.0.1:8000'

function getOrCreateId(key: string, prefix: string): string {
  let id = localStorage.getItem(key)
  if (!id) {
    id = `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
    localStorage.setItem(key, id)
  }
  return id
}

export function getConversationId(): string {
  return getOrCreateId('sofra_conversation_id', 'conversation')
}

export function getCustomerId(): string {
  return getOrCreateId('sofra_customer_id', 'customer')
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  const body = await res.json()
  if (!res.ok) {
    const msg =
      (body as Record<string, unknown>)?.error
        ? ((body as { error: { message?: string } }).error.message ?? 'API error')
        : (body as { detail?: string })?.detail ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  return body as T
}

export interface BackendCartResponse {
  lines: CartLine[]
  total: CartTotal
}

export interface ChatResponse {
  message: string
  conversation_id: string
  cart: CartLine[]
  total: CartTotal
  awaiting_confirmation: boolean
  order_id?: number
}

export interface BackendRestaurant {
  id: number
  name: string
  address: string
  phone: string
  opening_hours: string | null
  delivery_zones: string | null
  payment_note: string | null
}

export async function getMenu(availableOnly = true): Promise<MenuItem[]> {
  const q = availableOnly ? '?available_only=true' : ''
  return apiFetch<MenuItem[]>(`/menu${q}`)
}

export async function getCombos(): Promise<Combo[]> {
  return apiFetch<Combo[]>('/combos')
}

export async function getRestaurant(): Promise<BackendRestaurant> {
  return apiFetch<BackendRestaurant>('/restaurant')
}

export async function getCart(conversationId?: string): Promise<BackendCartResponse> {
  const cid = conversationId ?? getConversationId()
  return apiFetch<BackendCartResponse>(`/cart?conversation_id=${encodeURIComponent(cid)}`)
}

export async function addToCart(
  params: { item_id?: number; combo_id?: number; quantity: number; notes?: string },
  conversationId?: string,
  customerId?: string,
): Promise<BackendCartResponse> {
  const cid = conversationId ?? getConversationId()
  const custId = customerId ?? getCustomerId()
  return apiFetch<BackendCartResponse>(
    `/cart?conversation_id=${encodeURIComponent(cid)}&customer_id=${encodeURIComponent(custId)}`,
    { method: 'POST', body: JSON.stringify(params) },
  )
}

export async function updateCartLine(
  keyId: number,
  quantity: number,
  conversationId?: string,
): Promise<BackendCartResponse> {
  const cid = conversationId ?? getConversationId()
  return apiFetch<BackendCartResponse>(
    `/cart/${keyId}?conversation_id=${encodeURIComponent(cid)}`,
    { method: 'PATCH', body: JSON.stringify({ quantity }) },
  )
}

export async function removeCartLine(
  keyId: number,
  conversationId?: string,
): Promise<BackendCartResponse> {
  const cid = conversationId ?? getConversationId()
  return apiFetch<BackendCartResponse>(
    `/cart/${keyId}?conversation_id=${encodeURIComponent(cid)}`,
    { method: 'DELETE' },
  )
}

export async function sendChat(message: string): Promise<ChatResponse> {
  const cid = getConversationId()
  const custId = getCustomerId()
  return apiFetch<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({ conversation_id: cid, customer_id: custId, message }),
  })
}

export async function createOrder(params: {
  order_type: 'delivery' | 'pickup'
  delivery_address?: string
  customer_name?: string
  customer_phone?: string
}): Promise<OrderDetail> {
  const cid = getConversationId()
  const custId = getCustomerId()
  return apiFetch<OrderDetail>('/orders', {
    method: 'POST',
    body: JSON.stringify({ conversation_id: cid, customer_id: custId, ...params }),
  })
}

export async function getOrderStatus(conversationId?: string): Promise<OrderDetail> {
  const cid = conversationId ?? getConversationId()
  return apiFetch<OrderDetail>(`/orders/status/${encodeURIComponent(cid)}`)
}

export function connectOrderStatusWS(
  onEvent: (event: string, order: OrderDetail) => void,
  conversationId?: string,
): WebSocket {
  const cid = conversationId ?? getConversationId()
  const origin = window.location.origin
  const proto = origin.startsWith('https') ? 'wss' : 'ws'
  const socket = new WebSocket(`${proto}://127.0.0.1:8000/ws/customer/orders/${encodeURIComponent(cid)}`)
  socket.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data)
      if (data.event && data.order) {
        onEvent(data.event, data.order as OrderDetail)
      }
    } catch {
      // ignore keepalives / non-JSON frames
    }
  }
  return socket
}

export async function rateOrder(
  orderId: number,
  stars: number,
  comment?: string,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/orders/${orderId}/rating`, {
    method: 'POST',
    body: JSON.stringify({ stars, comment }),
  })
}
