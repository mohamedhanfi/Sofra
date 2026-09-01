import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'
import FoodPlaceholder from './FoodPlaceholder'
import PriceLabel from './PriceLabel'
import Button from './Button'

export default function ConfirmModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const { lang, t } = useLang()
  const { lines, subtotal, delivery_fee } = useCart()
  if (!open) return null

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('Review Your Order', 'راجع أوردرك')}</h2>
        <div className="confirm-lines">
          {lines.map((l) => (
            <div className="confirm-line" key={l.key}>
              <div className="confirm-line-name">
                <FoodPlaceholder size="sm" className="cart-line-thumb" />
                <span>
                  {l.quantity}× {lang === 'ar' ? l.title_ar : l.title_en}
                </span>
              </div>
              <PriceLabel value={l.unit_price * l.quantity} />
            </div>
          ))}
        </div>
        <div className="confirm-summary">
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
            <PriceLabel value={subtotal + delivery_fee} />
          </div>
        </div>
        <div className="confirm-actions">
          <Button variant="secondary" onClick={onClose}>
            {t('Go Back', 'ارجع')}
          </Button>
          <Button onClick={onSubmit}>{t('Place Order', 'أكّد الطلب')}</Button>
        </div>
      </div>
    </>
  )
}