import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { CartLine, CartTotal } from '../types'
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartLine as apiUpdateCartLine,
  removeCartLine as apiRemoveCartLine,
} from '../api/client'

interface CartContextValue {
  lines: CartLine[]
  updateQuantity: (key: string, delta: number) => void
  addLine: (line: Omit<CartLine, 'key'>) => void
  removeLine: (key: string) => void
  subtotal: number
  delivery_fee: number
  total: number
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  refreshCart: () => Promise<void>
  applyCartResponse: (resp: { lines: CartLine[]; total: CartTotal }) => void
}

const CartContext = createContext<CartContextValue | null>(null)

function parseKeyToId(key: string): number {
  return parseInt(key.replace(/^(item|combo)-/, ''), 10)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [totals, setTotals] = useState<CartTotal>({ subtotal: 0, delivery_fee: 0, total: 0 })
  const [cartOpen, setCartOpen] = useState(false)

  const applyCartResponse = useCallback((resp: { lines: CartLine[]; total: CartTotal }) => {
    setLines(resp.lines)
    setTotals(resp.total)
  }, [])

  const refreshCart = useCallback(async () => {
    try {
      const resp = await getCart()
      applyCartResponse(resp)
    } catch {
      // silently ignore – offline or first load
    }
  }, [applyCartResponse])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const subtotal = totals.subtotal
  const delivery_fee = totals.delivery_fee
  const total = totals.total

  async function updateQuantity(key: string, delta: number) {
    const id = parseKeyToId(key)
    const line = lines.find((l) => l.key === key)
    if (!line) return
    const newQty = line.quantity + delta
    if (newQty < 1) {
      // treat as remove
      try {
        const resp = await apiRemoveCartLine(id)
        applyCartResponse(resp)
      } catch {
        // fallback local
        setLines((prev) => prev.filter((l) => l.key !== key))
      }
      return
    }
    try {
      const resp = await apiUpdateCartLine(id, newQty)
      applyCartResponse(resp)
    } catch {
      setLines((prev) =>
        prev
          .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
          .filter((l) => l.quantity > 0),
      )
    }
  }

  async function removeLine(key: string) {
    const id = parseKeyToId(key)
    try {
      const resp = await apiRemoveCartLine(id)
      applyCartResponse(resp)
    } catch {
      setLines((prev) => prev.filter((l) => l.key !== key))
    }
  }

  async function addLine(line: Omit<CartLine, 'key'>) {
    try {
      const params: { item_id?: number; combo_id?: number; quantity: number } = {
        quantity: line.quantity,
      }
      if (line.type === 'item') params.item_id = line.id
      else params.combo_id = line.id
      const resp = await apiAddToCart(params)
      applyCartResponse(resp)
    } catch {
      // fallback: local update
      setLines((prev) => {
        const existing = prev.find((l) => l.type === line.type && l.id === line.id)
        if (existing) {
          return prev.map((l) =>
            l.type === line.type && l.id === line.id
              ? { ...l, quantity: l.quantity + line.quantity }
              : l,
          )
        }
        return [...prev, { ...line, key: `${line.type}-${line.id}` }]
      })
    }
  }

  return (
    <CartContext.Provider
      value={{
        lines,
        updateQuantity,
        addLine,
        removeLine,
        subtotal,
        delivery_fee,
        total,
        cartOpen,
        setCartOpen,
        refreshCart,
        applyCartResponse,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
