import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { fetchProducts } from './api'

const STORAGE_KEY = 'campus-customs-cart'

export type CartLine = {
  product_id: string
  name: string
  price: number
  image_url: string
  size: string
  color: string
  quantity: number
}

export type CartDraft = {
  product_id: string
  name: string
  price: number
  image_url: string
  size: string
  color: string
  stock: number
}

type CartContextValue = {
  lines: CartLine[]
  count: number
  notice: string
  addItem: (draft: CartDraft) => 'added' | 'capped'
  setQuantity: (productId: string, size: string, color: string, quantity: number) => void
  removeLine: (productId: string, size: string, color: string) => void
  emptyCart: () => void
  sizeCount: (productId: string, size: string) => number
  roomFor: (productId: string, size: string, fallbackStock: number) => number
}

const CartContext = createContext<CartContextValue | null>(null)

function lineKey(productId: string, size: string) {
  return `${productId}|${size}`
}

function isLine(value: unknown): value is CartLine {
  if (!value || typeof value !== 'object') return false
  const line = value as CartLine
  return (
    typeof line.product_id === 'string' &&
    typeof line.name === 'string' &&
    typeof line.price === 'number' &&
    typeof line.image_url === 'string' &&
    typeof line.size === 'string' &&
    typeof line.color === 'string' &&
    typeof line.quantity === 'number' &&
    line.quantity > 0
  )
}

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isLine) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readCart)
  const [stock, setStock] = useState<Map<string, number>>(() => new Map())
  const [notice, setNotice] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines])

  useEffect(() => {
    let active = true
    fetchProducts()
      .then((products) => {
        if (!active) return
        const map = new Map<string, number>()
        const byId = new Map(products.map((product) => [product.product_id, product]))
        for (const product of products) {
          for (const item of product.inventory) map.set(lineKey(product.product_id, item.size), item.quantity)
        }
        setStock(map)
        setLines((current) => {
          const next: CartLine[] = []
          const used = new Map<string, number>()
          let changed = false
          for (const line of current) {
            const key = lineKey(line.product_id, line.size)
            const cap = map.get(key) ?? 0
            const taken = used.get(key) ?? 0
            const quantity = Math.max(0, Math.min(line.quantity, cap - taken))
            const product = byId.get(line.product_id)
            if (quantity !== line.quantity || !product) changed = true
            if (quantity === 0 || !product) continue
            used.set(key, taken + quantity)
            next.push({
              ...line,
              name: product.name,
              price: product.price,
              image_url: product.image_url,
              quantity,
            })
          }
          if (changed) queueMicrotask(() => setNotice('Some cart quantities were updated to match current stock.'))
          return next
        })
      })
      .catch(() => {
        // The catalogue request failed. Keep the saved cart and still cap new adds from the page.
      })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo<CartContextValue>(() => {
    function usedInSize(current: CartLine[], productId: string, size: string, exceptColor?: string) {
      return current
        .filter((line) => line.product_id === productId && line.size === size && line.color !== exceptColor)
        .reduce((sum, line) => sum + line.quantity, 0)
    }

    function capFor(productId: string, size: string, fallback: number) {
      const key = lineKey(productId, size)
      return stock.has(key) ? (stock.get(key) ?? 0) : fallback
    }

    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      notice,
      sizeCount(productId, size) {
        return lines.filter((line) => line.product_id === productId && line.size === size).reduce((sum, line) => sum + line.quantity, 0)
      },
      roomFor(productId, size, fallbackStock) {
        const held = lines
          .filter((line) => line.product_id === productId && line.size === size)
          .reduce((sum, line) => sum + line.quantity, 0)
        return Math.max(0, capFor(productId, size, fallbackStock) - held)
      },
      addItem(draft) {
        const cap = capFor(draft.product_id, draft.size, draft.stock)
        let result: 'added' | 'capped' = 'capped'
        flushSync(() => {
          setLines((current) => {
            const used = current
              .filter((line) => line.product_id === draft.product_id && line.size === draft.size)
              .reduce((sum, line) => sum + line.quantity, 0)
            if (used >= cap || cap <= 0) return current
            result = 'added'
            const color = draft.color || 'Color not recorded'
            const existing = current.find(
              (line) => line.product_id === draft.product_id && line.size === draft.size && line.color === color,
            )
            if (existing) {
              return current.map((line) => (line === existing ? { ...line, quantity: line.quantity + 1 } : line))
            }
            return [
              ...current,
              {
                product_id: draft.product_id,
                name: draft.name,
                price: draft.price,
                image_url: draft.image_url,
                size: draft.size,
                color,
                quantity: 1,
              },
            ]
          })
        })
        return result
      },
      setQuantity(productId, size, color, quantity) {
        setLines((current) => {
          const cap = capFor(productId, size, Number.POSITIVE_INFINITY)
          const others = usedInSize(current, productId, size, color)
          const nextQuantity = Math.max(0, Math.min(quantity, cap - others))
          if (nextQuantity === 0) {
            return current.filter((line) => !(line.product_id === productId && line.size === size && line.color === color))
          }
          return current.map((line) =>
            line.product_id === productId && line.size === size && line.color === color
              ? { ...line, quantity: nextQuantity }
              : line,
          )
        })
      },
      removeLine(productId, size, color) {
        setLines((current) => current.filter((line) => !(line.product_id === productId && line.size === size && line.color === color)))
      },
      emptyCart() {
        setLines([])
      },
    }
  }, [lines, notice, stock])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext)
  if (!value) throw new Error('The shopping cart is not available on this page.')
  return value
}
