import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'
import { getMenu, createOrder } from '../api/client'
import type { MenuItem } from '../types'
import ChatWidget from '../components/ChatWidget'
import FoodPlaceholder from '../components/FoodPlaceholder'
import PriceLabel from '../components/PriceLabel'
import ConfirmModal from '../components/ConfirmModal'
import Button from '../components/Button'

export default function Chat() {
  const { lang, t } = useLang()
  const { lines, subtotal, delivery_fee, total } = useCart()
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')
  const [showConfirm, setShowConfirm] = useState(false)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [suggestedItems, setSuggestedItems] = useState<MenuItem[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    getMenu(true)
      .then((items) => setSuggestedItems(items.filter((i) => i.popular).slice(0, 3)))
      .catch(() => {})
  }, [])

  async function handleOrder() {
    try {
      await createOrder({
        order_type: orderType,
        delivery_address: orderType === 'delivery' ? address : undefined,
        customer_phone: phone || undefined,
      })
      setShowConfirm(false)
      navigate('/order/status')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to place order')
    }
  }

  return (
    <>
      <div className="order-page">
        <div className="chat-pane">
          <div className="phone-row">
            <input
              className="phone-input"
              placeholder={t('Phone (optional)', 'رقم الموبايل (اختياري)')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <span className="phone-hint">
              {t(
                'Skip to order as guest',
                'اتخطى للطلب كضيف'
              )}
            </span>
          </div>

          <ChatWidget />

          <div className="suggest-row">
            {suggestedItems.map((item) => (
              <button
                key={item.id}
                className="suggest-chip"
                onClick={() => {}}
              >
                {lang === 'ar' ? item.name_ar : item.name_en}{' '}
                — <PriceLabel value={item.price} />
              </button>
            ))}
          </div>
        </div>

        <div className="cart-pane">
          <h3>{t('Your Cart', 'سلتك')}</h3>
          {lines.length === 0 ? (
            <div className="cart-empty">
              <FoodPlaceholder size="md" />
              <p>
                {t(
                  'Your cart is empty — say hi to add something.',
                  'السلة فاضية — قول مرحبا تبدأ ترتيب.'
                )}
              </p>
            </div>
          ) : (
            <>
              {lines.map((line) => (
                <div className="cart-line" key={line.key}>
                  <FoodPlaceholder size="sm" className="cart-line-thumb" />
                  <div className="cart-line-main">
                    <div className="cart-line-top">
                      <strong>{lang === 'ar' ? line.title_ar : line.title_en}</strong>
                      <PriceLabel value={line.unit_price * line.quantity} />
                    </div>
                  </div>
                </div>
              ))}

              <div className="cart-order-type">
                <div className="ot-toggle">
                  <button
                    className={`ot-btn${orderType === 'delivery' ? ' active' : ''}`}
                    onClick={() => setOrderType('delivery')}
                  >
                    {t('Delivery', 'توصيل')}
                  </button>
                  <button
                    className={`ot-btn${orderType === 'pickup' ? ' active' : ''}`}
                    onClick={() => setOrderType('pickup')}
                  >
                    {t('Pickup', 'استلام')}
                  </button>
                </div>
              </div>

              {orderType === 'delivery' && (
                <input
                  className="address-input"
                  placeholder={t('Delivery address', 'عنوان التوصيل')}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              )}

              <div className="cart-summary">
                <div className="summary-row">
                  <span>{t('Subtotal', 'المجموع')}</span>
                  <PriceLabel value={subtotal} />
                </div>
                <div className="summary-row">
                  <span>{t('Delivery', 'التوصيل')}</span>
                  <PriceLabel value={delivery_fee} />
                </div>
                <div className="summary-row total">
                  <span>{t('Total', 'الإجمالي')}</span>
                  <PriceLabel value={total} />
                </div>
              </div>

              <Button fullWidth onClick={() => setShowConfirm(true)}>
                {t('Review & Confirm', 'مراجعة وتاكيد')}
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmModal open={showConfirm} onClose={() => setShowConfirm(false)} onSubmit={handleOrder} />
    </>
  )
}
