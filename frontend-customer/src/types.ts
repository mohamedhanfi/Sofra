export type Lang = 'en' | 'ar'

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
  featured?: boolean
  popular?: boolean
}

export interface ComboItemLine {
  item_name_en: string
  item_name_ar: string
  quantity: number
}

export interface Combo {
  id: number
  name_en: string
  name_ar: string
  combo_price: number
  photo_url?: string
  active: boolean
  items: ComboItemLine[]
  component_sum: number
}

export interface CartLine {
  key: string
  type: 'item' | 'combo'
  id: number
  title_en: string
  title_ar: string
  unit_price: number
  quantity: number
  photo_url?: string
}

export interface ChatMessage {
  id: number
  role: 'agent' | 'customer'
  text_en: string
  text_ar: string
  quickReplies?: { en: string; ar: string }[]
  items?: MenuItem[]
  addedItem?: MenuItem
}

export interface OrderItemDetail {
  id: number
  item_name_en: string
  item_name_ar: string
  quantity: number
  unit_price: number
  unit?: 'EGP'
}

export interface OrderDetail {
  id: number
  order_type: OrderType
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  total: number
  created_at: string
  items: OrderItemDetail[]
  rating?: { stars: number; comment?: string }
}

export interface RestaurantInfo {
  name_en: string
  name_ar: string
  address: string
  phone: string
  hours_en: string
  hours_ar: string
  payment_note_en: string
  payment_note_ar: string
  delivery_note_en: string
  delivery_note_ar: string
}

export interface CartTotal {
  subtotal: number
  delivery_fee: number
  total: number
}
