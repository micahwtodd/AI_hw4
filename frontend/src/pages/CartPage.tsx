import { Link } from 'react-router-dom'
import { formatPrice } from '../api'
import { useCart } from '../cart'

export function CartPage() {
  const { lines, notice, setQuantity, removeLine, emptyCart, roomFor } = useCart()
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)

  return (
    <section className="page cart-page">
      <p className="eyebrow">Campus Customs</p>
      <h1>Shopping Cart</h1>
      {notice && <p className="choose-note">{notice}</p>}
      {lines.length === 0 && (
        <p className="status">
          Nothing in the cart yet. <Link to="/products">Browse products</Link>
        </p>
      )}
      {lines.length > 0 && (
        <>
          <ul className="cart-lines cart-page-lines">
            {lines.map((line) => {
              const room = roomFor(line.product_id, line.size, line.quantity)
              return (
                <li key={`${line.product_id}|${line.size}|${line.color}`} className="cart-line">
                  <img src={line.image_url} alt="" />
                  <div>
                    <strong>
                      <Link to={`/products/${line.product_id}`}>{line.name}</Link>
                    </strong>
                    <p>
                      {line.color} · Size {line.size}
                    </p>
                    <p className="price">{formatPrice(line.price)}</p>
                    <div className="qty-step">
                      <button
                        type="button"
                        aria-label={`Fewer ${line.name}`}
                        onClick={() => setQuantity(line.product_id, line.size, line.color, line.quantity - 1)}
                      >
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
                  <p className="cart-line-total">{formatPrice(line.price * line.quantity)}</p>
                </li>
              )
            })}
          </ul>
          <p className="cart-subtotal">
            Subtotal <strong>{formatPrice(subtotal)}</strong>
          </p>
          <button type="button" className="cart-empty" onClick={emptyCart}>
            Empty cart
          </button>
        </>
      )}
    </section>
  )
}
