import type { MenuItem, Combo, Order, AnalyticsSummary, OrderStatus } from './types'

export const menuItems: MenuItem[] = [
  { id: 1, name_en: 'Koshary', name_ar: 'كشري', description_en: 'Rice, lentils, macaroni, chickpeas, crispy onions', description_ar: 'أرز وعدس ومكرونة وحمص وبصل محمر', price: 45, category: 'Koshary & Rice', available: true },
  { id: 2, name_en: 'Mixed Grill', name_ar: 'مشويات مشكلة', description_en: 'Kofta, shish tawook, lamb chops', price: 180, category: 'Grills', available: true },
  { id: 3, name_en: 'Foul Medames', name_ar: 'فول مدمس', price: 30, category: 'Mains', available: true },
  { id: 4, name_en: 'Taameya', name_ar: 'طعمية', price: 25, category: 'Sandwiches', available: true },
  { id: 5, name_en: 'Molokhia', name_ar: 'ملوخية', price: 60, category: 'Mains', available: false },
  { id: 6, name_en: 'Mango Juice', name_ar: 'عصير مانجو', price: 35, category: 'Drinks', available: true },
  { id: 7, name_en: 'Umm Ali', name_ar: 'أم علي', price: 50, category: 'Desserts', available: true },
]

export const combos: Combo[] = [
  {
    id: 1,
    name_en: 'Koshary Combo',
    name_ar: 'كومبو كشري',
    combo_price: 80,
    active: true,
    items: [
      { item_name_en: 'Koshary', item_name_ar: 'كشري', quantity: 1 },
      { item_name_en: 'Mango Juice', item_name_ar: 'عصير مانجو', quantity: 1 },
      { item_name_en: 'Umm Ali', item_name_ar: 'أم علي', quantity: 1 },
    ],
    component_sum: 130,
  },
  {
    id: 2,
    name_en: 'Grill Feast',
    name_ar: 'وليمة مشويات',
    combo_price: 320,
    active: true,
    items: [
      { item_name_en: 'Mixed Grill', item_name_ar: 'مشويات مشكلة', quantity: 2 },
      { item_name_en: 'Taameya', item_name_ar: 'طعمية', quantity: 2 },
    ],
    component_sum: 410,
  },
  {
    id: 3,
    name_en: 'Breakfast Bundle',
    name_ar: 'باقة الفطار',
    combo_price: 60,
    active: false,
    items: [
      { item_name_en: 'Foul Medames', item_name_ar: 'فول مدمس', quantity: 1 },
      { item_name_en: 'Taameya', item_name_ar: 'طعمية', quantity: 2 },
    ],
    component_sum: 80,
  },
]

export const orders: Order[] = [
  {
    id: 101,
    customer_name: 'Ahmed Hassan',
    customer_phone: '01012345678',
    order_type: 'delivery',
    delivery_address: '12 Mohamed Mahmoud, Downtown',
    subtotal: 160,
    delivery_fee: 20,
    total: 180,
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    items: [
      { id: 1, item_id: 1, item_name_en: 'Koshary', item_name_ar: 'كشري', quantity: 2, unit_price: 45 },
      { id: 2, combo_id: 1, item_name_en: 'Koshary Combo', item_name_ar: 'كومبو كشري', quantity: 1, unit_price: 80, bundled: [{ name_en: 'Koshary', quantity: 1 }, { name_en: 'Mango Juice', quantity: 1 }, { name_en: 'Umm Ali', quantity: 1 }] },
    ],
  },
  {
    id: 102,
    customer_name: 'Mona Ali',
    customer_phone: '01198765432',
    order_type: 'pickup',
    subtotal: 90,
    delivery_fee: 0,
    total: 90,
    status: 'preparing',
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    items: [
      { id: 1, item_id: 6, item_name_en: 'Mango Juice', item_name_ar: 'عصير مانجو', quantity: 2, unit_price: 35 },
      { id: 2, item_id: 7, item_name_en: 'Umm Ali', item_name_ar: 'أم علي', quantity: 1, unit_price: 20 },
    ],
  },
  {
    id: 103,
    customer_name: 'Karim Mostafa',
    customer_phone: '01239876540',
    order_type: 'delivery',
    delivery_address: '5 Road 9, Maadi',
    subtotal: 320,
    delivery_fee: 25,
    total: 345,
    status: 'ready',
    created_at: new Date(Date.now() - 40 * 60000).toISOString(),
    items: [
      { id: 1, combo_id: 2, item_name_en: 'Grill Feast', item_name_ar: 'وليمة مشويات', quantity: 1, unit_price: 320, bundled: [{ name_en: 'Mixed Grill', quantity: 2 }, { name_en: 'Taameya', quantity: 2 }] },
    ],
  },
  {
    id: 104,
    customer_name: 'Sara Nabil',
    customer_phone: '01055554444',
    order_type: 'delivery',
    delivery_address: '8 Orabi St, Heliopolis',
    subtotal: 130,
    delivery_fee: 20,
    total: 150,
    status: 'out_for_delivery',
    created_at: new Date(Date.now() - 65 * 60000).toISOString(),
    items: [
      { id: 1, item_id: 2, item_name_en: 'Mixed Grill', item_name_ar: 'مشويات مشكلة', quantity: 1, unit_price: 180 },
    ],
  },
  {
    id: 105,
    customer_name: 'Omar Farouk',
    customer_phone: '01112131415',
    order_type: 'pickup',
    subtotal: 60,
    delivery_fee: 0,
    total: 60,
    status: 'delivered',
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
    items: [
      { id: 1, combo_id: 3, item_name_en: 'Breakfast Bundle', item_name_ar: 'باقة الفطار', quantity: 1, unit_price: 60, bundled: [{ name_en: 'Foul Medames', quantity: 1 }, { name_en: 'Taameya', quantity: 2 }] },
    ],
  },
  {
    id: 106,
    customer_name: 'Laila Saad',
    customer_phone: '01223334455',
    order_type: 'delivery',
    delivery_address: '3 Makram Ebeid, Nasr City',
    subtotal: 120,
    delivery_fee: 20,
    total: 140,
    status: 'cancelled',
    cancel_reason: 'Customer requested cancellation',
    created_at: new Date(Date.now() - 200 * 60000).toISOString(),
    items: [
      { id: 1, item_id: 4, item_name_en: 'Taameya', item_name_ar: 'طعمية', quantity: 2, unit_price: 25 },
      { id: 2, item_id: 6, item_name_en: 'Mango Juice', item_name_ar: 'عصير مانجو', quantity: 2, unit_price: 35 },
    ],
  },
]

export const analyticsSummary: AnalyticsSummary = {
  order_count: 47,
  revenue: 6240,
  avg_order_value: 132.8,
  avg_rating: 4.5,
  top_items: [
    { name: 'Koshary', quantity: 38, revenue: 0 },
    { name: 'Mixed Grill', quantity: 25, revenue: 0 },
    { name: 'Taameya', quantity: 22, revenue: 0 },
    { name: 'Mango Juice', quantity: 18, revenue: 0 },
    { name: 'Umm Ali', quantity: 12, revenue: 0 },
  ],
  peak_hours: [
    { hour: 12, order_count: 9 },
    { hour: 13, order_count: 14 },
    { hour: 14, order_count: 11 },
    { hour: 19, order_count: 8 },
    { hour: 20, order_count: 6 },
    { hour: 21, order_count: 4 },
  ],
}

export const orderColumns: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'completed',
]

export const restaurantInfoMock = {
  name_en: 'Sofra Restaurant',
  name_ar: 'مطعم سفرة',
  address: '32 Tahrir St, Downtown, Cairo',
  phone: '02-12345678',
  opening_hours: {
    sat: '12:00 - 00:00',
    sun: '12:00 - 00:00',
    mon: '12:00 - 00:00',
    tue: '12:00 - 00:00',
    wed: '12:00 - 00:00',
    thu: '12:00 - 02:00',
    fri: '12:00 - 02:00',
  },
  delivery_zones: [
    { area: 'Downtown', fee: 20 },
    { area: 'Maadi', fee: 25 },
    { area: 'Heliopolis', fee: 25 },
    { area: 'Nasr City', fee: 30 },
  ],
  payment_note: 'Cash on delivery/pickup',
}
