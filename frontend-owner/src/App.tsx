import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
import Login from './pages/login'
import Dashboard from './pages/dashboard'
import OrdersBoard from './pages/orders-board'
import MenuManagement from './pages/menu-management'
import ComboManagement from './pages/combo-management'
import Analytics from './pages/analytics'
import RestaurantInfo from './pages/restaurant-info'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="orders" element={<OrdersBoard />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="combos" element={<ComboManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="restaurant-info" element={<RestaurantInfo />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
