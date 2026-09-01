import { useRef } from 'react'
import type { MenuItem } from '../types'
import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'
import FoodPlaceholder from './FoodPlaceholder'
import PriceLabel from './PriceLabel'

export default function MenuCard({ item }: { item: MenuItem }) {
  const { lang, t } = useLang()
  const { addLine } = useCart()
  const cardRef = useRef<HTMLDivElement>(null)

  const title = lang === 'ar' ? item.name_ar : item.name_en
  const desc = lang === 'ar' ? item.description_ar : item.description_en

  function handleAdd() {
    addLine({
      type: 'item',
      id: item.id,
      title_en: item.name_en,
      title_ar: item.name_ar,
      unit_price: item.price,
      quantity: 1,
    })
    if (cardRef.current) {
      cardRef.current.classList.remove('menu-card-pulse')
      void cardRef.current.offsetWidth
      cardRef.current.classList.add('menu-card-pulse')
    }
  }

  return (
    <div
      ref={cardRef}
      className={`menu-card${!item.available ? ' unavailable' : ''}`}
    >
      <div className="menu-card-photo">
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name_en} />
        ) : (
          <FoodPlaceholder size="md" className="w-full" />
        )}
        {item.popular && <span className="badge-popular">{t('Popular', 'الأكثر طلباً')}</span>}
        {!item.available && (
          <span className="badge-soldout">{t('Sold out today', 'نفد اليوم')}</span>
        )}
      </div>
      <div className="menu-card-body">
        <h3>{title}</h3>
        <p className="menu-card-desc">{desc}</p>
        <div className="menu-card-foot">
          <PriceLabel value={item.price} />
          {item.available && (
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>
              {t('Add', 'أضِف')} +
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
