import type {
  MenuItem,
  Combo,
  CartLine,
  ChatMessage,
  OrderDetail,
  RestaurantInfo,
  CartTotal,
  OrderStatus,
} from './types'

export const menuItems: MenuItem[] = [
  { id: 1, name_en: 'Koshary', name_ar: 'كشري', description_en: 'Rice, lentils, macaroni, chickpeas, crispy onions with spicy tomato sauce.', description_ar: 'أرز وعدس ومكرونة وحمص وبصل محمر مع صوص طماطم حار.', price: 45, category: 'Koshary & Rice', available: true, featured: true, popular: true },
  { id: 2, name_en: 'Mixed Grill', name_ar: 'مشويات مشكلة', description_en: 'Kofta, shish tawook and lamb chops served with bread and grilled veg.', description_ar: 'كفتة وشيش طاووق وريش غنم مع عيش وخضار مشوي.', price: 180, category: 'Grills', available: true, featured: true, popular: true },
  { id: 3, name_en: 'Foul Medames', name_ar: 'فول مدمس', description_en: 'Slow-cooked fava beans with cumin, olive oil and lemon.', description_ar: 'فول مطبوخ ببطء مع كمون وزيت زيتون وليمون.', price: 30, category: 'Mains', available: true },
  { id: 4, name_en: 'Taameya', name_ar: 'طعمية', description_en: 'Crispy falafel patties with fresh vegetables and tahini.', description_ar: 'أقراص طعمية مقرمشة مع خضار طازج وطحينة.', price: 25, category: 'Sandwiches', available: true, popular: true },
  { id: 5, name_en: 'Molokhia', name_ar: 'ملوخية', description_en: 'Classic green soup with garlic and coriander, with rice.', description_ar: 'ملوخية بالثوم والكزبرة مع أرز.', price: 60, category: 'Mains', available: false },
  { id: 6, name_en: 'Mango Juice', name_ar: 'عصير مانجو', description_en: 'Fresh mango juice, thick and naturally sweet.', description_ar: 'عصير مانجو طازج كثيف.', price: 35, category: 'Drinks', available: true },
  { id: 7, name_en: 'Umm Ali', name_ar: 'أم علي', description_en: 'Warm Egyptian bread pudding with nuts and cream.', description_ar: 'أم علي ساخنة بالمكسرات والقشطة.', price: 50, category: 'Desserts', available: true, featured: true, popular: true },
  { id: 8, name_en: 'Koshary Kebab', name_ar: 'كباب كشري', description_en: 'Koshary topped with grilled kofta skewers.', description_ar: 'كشري بصوص الكباب والكفتة.', price: 75, category: 'Koshary & Rice', available: true },
  { id: 9, name_en: 'Shish Tawook', name_ar: 'شيش طاووق', description_en: 'Grilled chicken skewers marinated in garlic and lemon.', description_ar: 'أسياخ فراخ مشوية متبلة بالثوم والليمون.', price: 120, category: 'Grills', available: true, popular: true },
  { id: 10, name_en: 'Lemon Mint', name_ar: 'ليمون بالنعناع', description_en: 'Fresh lemonade with mint leaves.', description_ar: 'ليموناضة طازجة بالنعناع.', price: 30, category: 'Drinks', available: true },
  { id: 11, name_en: 'Kunafa', name_ar: 'كنافة', description_en: 'Crispy pastry with cheese and syrup.', description_ar: 'كنافة بالجبنة مع شربات.', price: 45, category: 'Desserts', available: true, popular: true },
  { id: 12, name_en: 'Shawarma', name_ar: 'شاورما', description_en: 'Tender chicken shawarma with garlic sauce.', description_ar: 'شاورما فراخ طرية بالسجق.', price: 40, category: 'Sandwiches', available: true, popular: true },
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
    name_en: 'Family Koshary',
    name_ar: 'كشري عائلي',
    combo_price: 150,
    active: true,
    items: [
      { item_name_en: 'Koshary', item_name_ar: 'كشري', quantity: 4 },
      { item_name_en: 'Lemon Mint', item_name_ar: 'ليمون بالنعناع', quantity: 4 },
    ],
    component_sum: 240,
  },
]

export const initialCart: CartLine[] = [
  { key: 'item-1', type: 'item', id: 1, title_en: 'Koshary', title_ar: 'كشري', unit_price: 45, quantity: 2 },
  { key: 'combo-1', type: 'combo', id: 1, title_en: 'Koshary Combo', title_ar: 'كومبو كشري', unit_price: 80, quantity: 1 },
]

export const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'agent',
    text_en: 'Ahlaan! 👋 Welcome to Sofra. Here are a few of our most popular dishes:',
    text_ar: 'أهلاً! 👋 مرحباً بك في سفرة. دي أشهر الأكلات عندنا:',
    items: [menuItems[0], menuItems[1], menuItems[3]],
  },
  {
    id: 2,
    role: 'customer',
    text_en: 'I want Koshary, please',
    text_ar: 'عايز كشري من فضلك',
  },
  {
    id: 3,
    role: 'agent',
    text_en: 'Great choice! I added Koshary (2×) to your cart. Anything else?',
    text_ar: 'اختيار ممتاز! ضفت كشري (2×) لسلتك. محتاج حاجة تانية؟',
    addedItem: menuItems[0],
    quickReplies: [
      { en: 'Add a drink', ar: 'ضيف مشروب' },
      { en: 'Show me the menu', ar: 'وريني المنيو' },
      { en: 'Confirm my order', ar: 'أكّد طلبي' },
    ],
  },
]

export const cartTotal: CartTotal = {
  subtotal: 170,
  delivery_fee: 20,
  total: 190,
}

export const orderDetail: OrderDetail = {
  id: 204,
  order_type: 'delivery',
  status: 'preparing',
  subtotal: 170,
  delivery_fee: 20,
  total: 190,
  created_at: new Date(Date.now() - 12 * 60000).toISOString(),
  items: [
    { id: 1, item_name_en: 'Koshary', item_name_ar: 'كشري', quantity: 2, unit_price: 45 },
    { id: 2, item_name_en: 'Koshary Combo', item_name_ar: 'كومبو كشري', quantity: 1, unit_price: 80 },
  ],
}

export const restaurantInfo: RestaurantInfo = {
  name_en: 'Sofra Restaurant',
  name_ar: 'مطعم سفرة',
  address: '32 Tahrir St, Downtown, Cairo',
  phone: '02-12345678',
  hours_en: 'Daily 12:00 PM – 12:00 AM, Fri/Sat until 2:00 AM',
  hours_ar: 'يومياً من 12 ظهراً حتى 12 منتصف الليل، الجمعة والسبت حتى 2 صباحاً',
  payment_note_en: 'Cash on delivery / pickup',
  payment_note_ar: 'الدفع كاش عند الاستلام أو التوصيل',
  delivery_note_en: 'Delivery fee varies by zone (20–30 EGP)',
  delivery_note_ar: 'رسوم التوصيل حسب المنطقة (20–30 ج.م)',
}

export const categories = ['Mains', 'Grills', 'Koshary & Rice', 'Sandwiches', 'Drinks', 'Desserts']

export const statusOrder: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
]
