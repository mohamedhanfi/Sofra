import type { MenuItem, Combo, Order, OrderStatus, ComboItemLine } from '../types'

export const BASE_URL = 'http://127.0.0.1:8000'
export const TOKEN_KEY = 'sofra_admin_token'
export const USERNAME_KEY = 'sofra_admin_username'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY)
}

export function setUsername(username: string) {
  localStorage.setItem(USERNAME_KEY, username)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function onAuthFailure() {
  clearAuth()
  window.location.href = '/login'
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    onAuthFailure()
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (data && data.detail) {
        message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
      } else if (data && data.error && data.error.code) {
        message = data.error.code
      }
    } catch {
      message = `Request failed (${res.status})`
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

async function request<T>(path: string, options: RequestInit = {}, isAdmin = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(isAdmin ? authHeaders() : {}),
    ...(options.headers as Record<string, string> | undefined),
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  return handleResponse<T>(res)
}

function get<T>(path: string, isAdmin = true): Promise<T> {
  return request<T>(path, { method: 'GET' }, isAdmin)
}

function send<T>(path: string, method: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export interface LoginResponse {
  token: string
  username: string
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await request<LoginResponse>(
    '/admin/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
    false
  )
  return res
}

export interface Restaurant {
  id: number
  name: string
  address: string
  phone: string
  opening_hours: unknown
  delivery_zones: unknown
  payment_note: string
}

export function getRestaurant(): Promise<Restaurant> {
  return get<Restaurant>('/restaurant', false)
}

export function updateRestaurant(data: Record<string, unknown>): Promise<Restaurant> {
  return send<Restaurant>('/admin/restaurant', 'PUT', data)
}

export function getMenuAdmin(): Promise<MenuItem[]> {
  return get<MenuItem[]>('/admin/menu')
}

export interface CreateItemInput {
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  price: number
  category: string
  photo_url?: string
  available: boolean
}

export function createItem(data: CreateItemInput): Promise<MenuItem> {
  return send<MenuItem>('/admin/menu', 'POST', data)
}

export function updateItem(id: number, data: Partial<CreateItemInput>): Promise<MenuItem> {
  return send<MenuItem>(`/admin/menu/${id}`, 'PUT', data)
}

export function setItemAvailability(id: number, available: boolean): Promise<MenuItem> {
  return send<MenuItem>(`/admin/menu/${id}/availability`, 'PATCH', { available })
}

export function deleteItem(id: number): Promise<{ ok: boolean }> {
  return send<{ ok: boolean }>(`/admin/menu/${id}`, 'DELETE')
}

export function getCombosAdmin(): Promise<Combo[]> {
  return get<Combo[]>('/admin/combos')
}

export interface CreateComboInput {
  name_en: string
  name_ar: string
  combo_price: number
  photo_url?: string
  active: boolean
  items: ComboItemLine[]
}

export function createCombo(data: CreateComboInput): Promise<Combo> {
  return send<Combo>('/admin/combos', 'POST', data)
}

export function updateCombo(id: number, data: Partial<CreateComboInput>): Promise<Combo> {
  return send<Combo>(`/admin/combos/${id}`, 'PUT', data)
}

export function setComboActive(id: number, active: boolean): Promise<Combo> {
  return send<Combo>(`/admin/combos/${id}/active`, 'PATCH', { active })
}

export function deleteCombo(id: number): Promise<{ ok: boolean }> {
  return send<{ ok: boolean }>(`/admin/combos/${id}`, 'DELETE')
}

export function getOrders(params?: {
  order_type?: string
  status?: string
}): Promise<Order[]> {
  const query = new URLSearchParams()
  if (params?.order_type) query.set('order_type', params.order_type)
  if (params?.status) query.set('status', params.status)
  const qs = query.toString()
  return get<Order[]>(`/admin/orders${qs ? `?${qs}` : ''}`)
}

export function getOrder(id: number): Promise<Order> {
  return get<Order>(`/admin/orders/${id}`)
}

export function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  return send<Order>(`/admin/orders/${id}/status`, 'PATCH', { status })
}

export function cancelOrder(id: number, reason: string): Promise<Order> {
  return send<Order>(`/admin/orders/${id}/cancel`, 'POST', { reason })
}

export type AnalyticsPeriod = 'today' | '7d' | '30d'

export interface AnalyticsTopItem {
  name: string
  quantity: number
  revenue: number
}

export interface AnalyticsPeakHour {
  hour: number
  order_count: number
}

export interface AnalyticsResponse {
  order_count: number
  revenue: number
  avg_order_value: number
  avg_rating: number
  top_items: AnalyticsTopItem[]
  peak_hours: AnalyticsPeakHour[]
}

export function getAnalytics(period: AnalyticsPeriod = '7d'): Promise<AnalyticsResponse> {
  return get<AnalyticsResponse>(`/admin/analytics?period=${period}`)
}

export interface Customer {
  phone: string
  name: string
  last_order: {
    id: number
    status: string
    total: number
    created_at: string
  } | null
  created_at: string
}

export function getCustomers(): Promise<Customer[]> {
  return get<Customer[]>('/admin/customers')
}
