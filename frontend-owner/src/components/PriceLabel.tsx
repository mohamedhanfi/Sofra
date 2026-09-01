export default function PriceLabel({
  value,
  lang = 'en',
}: {
  value: number
  lang?: 'en' | 'ar'
}) {
  const formatted = value.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    maximumFractionDigits: 0,
  })
  return (
    <span className="price-label">
      {formatted} {lang === 'ar' ? 'ج.م' : 'EGP'}
    </span>
  )
}
