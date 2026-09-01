import { Outlet, NavLink, Link } from 'react-router-dom'
import { ShoppingCart, Home, UtensilsCrossed, MessageCircle, Info } from 'lucide-react'
import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'

export default function Layout() {
  const { lang, setLang, t } = useLang()
  const { lines, setCartOpen } = useCart()
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0)

  const tabs = [
    { to: '/', en: 'Home', ar: 'الرئيسية', Icon: Home },
    { to: '/menu', en: 'Menu', ar: 'المنيو', Icon: UtensilsCrossed },
    { to: '/order', en: 'Order', ar: 'اطلب', Icon: MessageCircle },
    { to: '/about', en: 'About', ar: 'عنا', Icon: Info },
  ]

  return (
    <div className="customer-app" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark">س</span>
          <span className="brand-name">Sofra</span>
        </Link>
        <nav className="header-nav">
          {tabs.slice(0, 3).map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) => (isActive ? 'header-link active' : 'header-link')}
            >
              {t(tab.en, tab.ar)}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
          <button className={`cart-btn${itemCount > 0 ? ' cart-badge-bounce' : ''}`} onClick={() => setCartOpen(true)}>
            <ShoppingCart size={18} />
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </button>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <nav className="bottom-tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) => (isActive ? 'bottom-tab active' : 'bottom-tab')}
          >
            <tab.Icon size={18} />
            <span>{t(tab.en, tab.ar)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}