import { useState } from 'react'
import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'
import FoodPlaceholder from './FoodPlaceholder'
import PriceLabel from './PriceLabel'
import Button from './Button'

export default function CartDrawer() {
  const { lang, t } = useLang()
  const { lines, updateQuantity, removeLine, cartOpen, setCartOpen, subtotal, delivery_fee, total } =
    useCart()
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')

  if (!cartOpen) return null

  return (
    <>
      <div className="drawer-backdrop" onClick={() => setCartOpen(false)} />
      <aside className="cart-drawer">
        <div className="drawer-header">
          <h2>{t('Your Cart', 'سلة طلباتك')}</h2>
          <button className="drawer-close" onClick={() => setCartOpen(false)}>
            ✕
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="drawer-empty">
            <FoodPlaceholder size="md" />
            <p>{t('Your cart is empty — start by saying hi 👋', 'السلة فاضية — ابدأ بقول مرحبا 👋')}</p>
          </div>
        ) : (
          <>
            <div className="drawer-lines">
              {lines.map((line) => (
                <div className="drawer-line" key={line.key}>
                  <FoodPlaceholder size="sm" className="cart-line-thumb" />
                  <div className="drawer-line-main">
                    <div className="drawer-line-info">
                      <strong>{lang === 'ar' ? line.title_ar : line.title_en}</strong>
                      <PriceLabel value={line.unit_price * line.quantity} />
                    </div>
                    <div className="drawer-line-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(line.key, -1)}
                      >
                        −
                      </button>
                      <span className="qty-val">{line.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(line.key, 1)}
                      >
                        +
                      </button>
                      <button className="remove-btn" onClick={() => removeLine(line.key)}>
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-order-type">
              <span className="ot-label">{t('Order type:', 'نوع الطلب:')}</span>
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

            <div className="drawer-summary">
              <div className="summary-row">
                <span>{t('Subtotal', 'المجموع')}</span>
                <PriceLabel value={subtotal} />
              </div>
              <div className="summary-row">
                <span>{t('Delivery', 'التوصيل')}</span>
                <PriceLabel value={orderType === 'delivery' ? delivery_fee : 0} />
              </div>
              <div className="summary-row total">
                <span>{t('Total', 'الإجمالي')}</span>
                <PriceLabel value={total + (orderType === 'delivery' ? 0 : -delivery_fee)} />
              </div>
            </div>

            <Button fullWidth>{t('Review & Confirm', 'مراجعة وتاكيد')}</Button>
          </>
        )}
      </aside>
    </>
  )
}