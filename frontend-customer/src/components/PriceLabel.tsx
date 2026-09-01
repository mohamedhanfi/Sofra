import { useLang } from '../context/LangContext'

export default function PriceLabel({ value }: { value: number }) {
  const { lang } = useLang()
  const formatted = value.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    maximumFractionDigits: 0,
  })
  return (
    <span className="price">
      {formatted} {lang === 'ar' ? 'ج.م' : 'EGP'}
    </span>
  )
}