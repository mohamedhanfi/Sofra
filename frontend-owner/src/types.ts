export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export type OrderType = 'delivery' | 'pickup'

export interface MenuItem {
  id: number
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  price: number
  category: string
  photo_url?: string
  available: boolean
}

export interface ComboItemLine {
  item_id: number
  quantity: number
}

export interface Combo {
  id: number
  name_en: string
  name_ar: string
  combo_price: number
  photo_url?: string
  active: boolean
  items?: { item_id?: number; item_name_en: string; item_name_ar: string; quantity: number }[]
  component_sum?: number
}

export interface OrderItem {
  id: number
  item_id?: number
  combo_id?: number
  item_name_en: string
  item_name_ar: string
  quantity: number
  unit_price: number
  notes?: string
  bundled?: { name_en: string; quantity: number }[]
}

export interface Order {
  id: number
  conversation_id?: string | number
  customer_name?: string
  customer_phone?: string
  order_type: OrderType
  delivery_address?: string
  subtotal: number
  delivery_fee: number
  total: number
  status: OrderStatus
  cancel_reason?: string
  created_at: string
  rating?: {
    stars: number
    comment?: string
  } | null
  items: OrderItem[]
}

export interface AnalyticsSummary {
  order_count: number
  revenue: number
  avg_order_value: number
  avg_rating: number
  top_items: { name: string; quantity: number; revenue: number }[]
  peak_hours: { hour: number; order_count: number }[]
}
