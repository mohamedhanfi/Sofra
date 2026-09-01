import type { Combo } from '../types'
import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'
import FoodPlaceholder from './FoodPlaceholder'
import PriceLabel from './PriceLabel'

export default function ComboCard({ combo }: { combo: Combo }) {
  const { lang, t } = useLang()
  const { addLine } = useCart()

  const title = lang === 'ar' ? combo.name_ar : combo.name_en
  const savings = combo.component_sum - combo.combo_price

  return (
    <div className={`combo-card combo-gold${!combo.active ? ' unavailable' : ''}`}>
      <div className="combo-card-media">
        {combo.photo_url ? (
          <img src={combo.photo_url} alt={combo.name_en} />
        ) : (
          <FoodPlaceholder size="md" aspect="4/3" className="w-full" />
        )}
        <span className="combo-ribbon">{t('Combo', 'كومبو')}</span>
      </div>
      <div className="combo-card-body">
        <h3>{title}</h3>
        <ul className="combo-item-list">
          {combo.items.map((it, i) => (
            <li key={i}>
              {it.quantity}× {lang === 'ar' ? it.item_name_ar : it.item_name_en}
            </li>
          ))}
        </ul>
        <div className="combo-card-pricing">
          <PriceLabel value={combo.combo_price} />
          <span className="combo-strike">
            <PriceLabel value={combo.component_sum} />
          </span>
          {savings > 0 && (
            <span className="combo-save">
              {t(`Save ${savings} EGP`, `وفّر ${savings} ج.م`)}
            </span>
          )}
        </div>
        {combo.active && (
          <button
            className="btn btn-primary btn-full"
            onClick={() =>
              addLine({
                type: 'combo',
                id: combo.id,
                title_en: combo.name_en,
                title_ar: combo.name_ar,
                unit_price: combo.combo_price,
                quantity: 1,
                photo_url: combo.photo_url,
              })
            }
          >
            {t('Add Combo', 'أضِف الكومبو')} +
          </button>
        )}
      </div>
    </div>
  )
}
