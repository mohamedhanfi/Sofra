import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { isAuthenticated } from '../api/client'

const links = [
  { to: '/dashboard', label: 'Dashboard', ar: 'لوحة التحكم' },
  { to: '/orders', label: 'Orders', ar: 'الطلبات' },
  { to: '/menu', label: 'Menu', ar: 'المنيو' },
  { to: '/combos', label: 'Combos', ar: 'الكومبوهات' },
  { to: '/analytics', label: 'Analytics', ar: 'التحليلات' },
  { to: '/restaurant-info', label: 'Restaurant Info', ar: 'معلومات المطعم' },
]

export default function Layout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">Sofra <span>//</span> Owner</div>
        <nav>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>Sofra Restaurant — Downtown</div>
          <div>Admin account</div>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
