import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { formatPrice } from '../api'
import { useChatMatches } from '../chatMatches'

export function ChatResults() {
  const { question, products, clear } = useChatMatches()
  const location = useLocation()
  const panel = useRef<HTMLElement>(null)
  const onDetail = /^\/products\/[^/]+$/.test(location.pathname)

  useEffect(() => {
    if (products.length === 0 || onDetail) return
    panel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [question, products, onDetail])

  if (products.length === 0 || onDetail) return null

  return (
    <section className="chat-results" ref={panel} aria-live="polite" aria-label="Matches from the chat">
      <div className="chat-results-head">
        <div>
          <p className="eyebrow">From the chat</p>
          <h2>Matches for “{question}”</h2>
        </div>
        <button type="button" className="chat-results-clear" onClick={clear}>
          Clear
        </button>
      </div>
      <div className="product-grid">
        {products.map((product) => {
          const colors = product.colors?.slice(0, 3).join(', ')
          const note = colors ? `${colors} · ${product.total_stock} in stock` : `${product.total_stock} in stock`
          return (
            <Link key={product.product_id} className="product-card" to={`/products/${product.product_id}`}>
              <img src={product.image_url} alt="" />
              <div className="product-card-body">
                <p className="garment-type">{product.garment_type}</p>
                <h3>{product.name}</h3>
                <p className="price">{formatPrice(product.price)}</p>
                <p className="card-note">{note}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
