import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../api'
import { useCart } from '../cart'

export function CartButton() {
  const { lines, count, notice, setQuantity, removeLine, emptyCart, roomFor } = useCart()
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function onPointer(event: MouseEvent) {
      if (!panel.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  return (
    <div className="cart-menu" ref={panel}>
      <button
        type="button"
        className="cart-button"
        aria-expanded={open}
        aria-label={count === 1 ? 'Shopping Cart, 1 item' : count === 0 ? 'Shopping Cart, empty' : `Shopping Cart, ${count} items`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="cart-icon">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              strokeLinecap="round"
              d="M5 6h3.2l1.2 3.2M9.4 9.2h16.2l-2.2 9.2H11.2L9.4 9.2z"
            />
            <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M12.2 18.4L10.6 9.2" />
            <circle cx="13" cy="24.5" r="1.8" fill="currentColor" />
            <circle cx="21.5" cy="24.5" r="1.8" fill="currentColor" />
          </svg>
          {count > 0 && <span className="cart-count">{count}</span>}
        </span>
        <span className="cart-label">Shopping Cart</span>
      </button>
      {open && (
        <div className="cart-panel" role="dialog" aria-labelledby="cart-title">
          <h2 id="cart-title">Your cart</h2>
          {notice && <p className="choose-note">{notice}</p>}
          {lines.length === 0 && <p className="status">Nothing in the cart yet.</p>}
          <ul className="cart-lines">
            {lines.map((line) => {
              const room = roomFor(line.product_id, line.size, line.quantity)
              return (
                <li key={`${line.product_id}|${line.size}|${line.color}`} className="cart-line">
                  <img src={line.image_url} alt="" />
                  <div>
                    <strong>{line.name}</strong>
                    <p>
                      {line.color} · Size {line.size}
                    </p>
                    <p className="price">{formatPrice(line.price)}</p>
                    <div className="qty-step">
                      <button type="button" aria-label={`Fewer ${line.name}`} onClick={() => setQuantity(line.product_id, line.size, line.color, line.quantity - 1)}>
                        −
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`More ${line.name}`}
                        disabled={room <= 0}
                        onClick={() => setQuantity(line.product_id, line.size, line.color, line.quantity + 1)}
                      >
                        +
                      </button>
                      <button type="button" className="cart-remove" onClick={() => removeLine(line.product_id, line.size, line.color)}>
                        Remove
                      </button>
                    </div>
                    {room <= 0 && <p className="choose-note">That is all we have in this size.</p>}
                  </div>
                </li>
              )
            })}
          </ul>
          {lines.length > 0 && (
            <p className="cart-subtotal">
              Subtotal <strong>{formatPrice(subtotal)}</strong>
            </p>
          )}
          <div className="cart-actions">
            {lines.length > 0 && (
              <button type="button" className="cart-empty" onClick={emptyCart}>
                Empty cart
              </button>
            )}
            <Link className="cart-page-link" to="/cart" onClick={() => setOpen(false)}>
              View shopping cart
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

