import { useState, useEffect } from 'react'
import { useLang } from '../context/LangContext'
import { getRestaurant, type BackendRestaurant } from '../api/client'

export default function About() {
  const { t } = useLang()
  const [info, setInfo] = useState<BackendRestaurant | null>(null)

  useEffect(() => {
    getRestaurant().then(setInfo).catch(() => {})
  }, [])

  if (!info) {
    return (
      <div className="about-page">
        <p>{t('Loading...', 'جاري التحميل...')}</p>
      </div>
    )
  }

  return (
    <div className="about-page">
      <h1>{t(info.name, info.name)}</h1>

      <div className="about-grid">
        <div className="about-section">
          <h2>{t('Address', 'العنوان')}</h2>
          <p>{info.address}</p>
          <p>{info.phone}</p>
        </div>
        <div className="about-section">
          <h2>{t('Hours', 'المواعيد')}</h2>
          <p>{info.opening_hours ?? t('Contact us for hours', 'تواصل معنا للمواعيد')}</p>
        </div>
        <div className="about-section">
          <h2>{t('Delivery', 'التوصيل')}</h2>
          <p>{info.delivery_zones ?? t('Delivery available', 'التوصيل متاح')}</p>
        </div>
        <div className="about-section">
          <h2>{t('Payment', 'الدفع')}</h2>
          <p>{info.payment_note ?? t('Cash on delivery', 'الدفع عند الاستلام')}</p>
        </div>
      </div>
    </div>
  )
}
