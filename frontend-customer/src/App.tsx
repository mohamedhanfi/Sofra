import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/home'
import Menu from './pages/menu'
import Chat from './pages/chat'
import OrderStatus from './pages/order-status'
import About from './pages/about'
import CartDrawer from './components/CartDrawer'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="menu" element={<Menu />} />
          <Route path="order" element={<Chat />} />
          <Route path="order/:id/status" element={<OrderStatus />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
      <CartDrawer />
    </>
  )
}
