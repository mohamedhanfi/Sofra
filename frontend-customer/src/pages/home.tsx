import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, Truck, ChefHat, Clock, Phone, MapPin, Share2, AtSign } from 'lucide-react'
import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'
import { getMenu, getRestaurant, type BackendRestaurant } from '../api/client'
import type { MenuItem } from '../types'
import MenuCard from '../components/MenuCard'
import FoodPlaceholder from '../components/FoodPlaceholder'
import Button from '../components/Button'

export default function Home() {
  const { t } = useLang()
  const { setCartOpen } = useCart()
  const [items, setItems] = useState<MenuItem[]>([])
  const [restaurant, setRestaurant] = useState<BackendRestaurant | null>(null)

  useEffect(() => {
    getMenu(true).then(setItems).catch(() => {})
    getRestaurant().then(setRestaurant).catch(() => {})
  }, [])

  const featured = items.filter((i) => i.featured && i.available).slice(0, 4)

  const valueProps = [
    { Icon: Leaf, en: 'Fresh Daily', ar: 'طازج يومياً', sub_en: 'Prepared from scratch', sub_ar: 'بيتحضر من الأول' },
    { Icon: Truck, en: 'Fast Delivery', ar: 'توصيل سريع', sub_en: 'Hot at your door', sub_ar: 'سخن لحد بابك' },
    { Icon: ChefHat, en: 'Authentic Recipes', ar: 'وصفات أصلية', sub_en: 'Real Egyptian taste', sub_ar: 'طعم مصري أصيل' },
  ]

  return (
    <>
      <section className="hero">
        <div className="hero-photo-wrap">
          <FoodPlaceholder size="lg" aspect="4/3" label="" className="hero-photo-img" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1>{t('Authentic Egyptian Flavours', 'نكهات مصرية أصلية')}</h1>
            <p className="hero-sub">
              {t(
                'Fresh koshary, sizzling grills and classic desserts — ordered in 30 seconds.',
                'كشري طازج، مشويات ساخنة وحلويات كلاسيكية — اطلب في 30 ثانية.'
              )}
            </p>
            <div className="hero-actions">
              <Link to="/menu">
                <Button>{t('View Menu', 'شوف المنيو')}</Button>
              </Link>
              <Link to="/order">
                <Button variant="secondary">{t('Order Now', 'اطلب دلوقتي')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="value-props">
        {valueProps.map((vp) => (
          <div className="value-prop" key={vp.en}>
            <span className="value-prop-icon">
              <vp.Icon size={20} />
            </span>
            <div>
              <strong>{t(vp.en, vp.ar)}</strong>
              <span className="value-prop-sub">{t(vp.sub_en, vp.sub_ar)}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="featured">
        <h2>{t('Popular Dishes', 'الأكتر طلباً')}</h2>
        <div className="featured-grid">
          {featured.map((item) => (
            <Link
              to="/order"
              className="featured-link"
              key={item.id}
              onClick={() => setCartOpen(true)}
            >
              <MenuCard item={item} />
            </Link>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-col">
          <h4>{t('Hours', 'المواعيد')}</h4>
          <p>
            <Clock size={14} /> {restaurant?.opening_hours ?? t('Daily 12PM – 12AM', 'يومياً 12 ظهراً – 12 منتصف الليل')}
          </p>
        </div>
        <div className="footer-col">
          <h4>{t('Contact', 'للتواصل')}</h4>
          <p>
            <MapPin size={14} /> {restaurant?.address ?? 'Cairo'}
          </p>
          <p>
            <Phone size={14} /> {restaurant?.phone ?? ''}
          </p>
        </div>
        <div className="footer-col">
          <h4>{t('Follow Us', 'تابعنا')}</h4>
          <div className="footer-social">
            <span className="social-link"><Share2 size={16} /> Instagram</span>
            <span className="social-link"><AtSign size={16} /> Facebook</span>
          </div>
        </div>
      </footer>
    </>
  )
}
