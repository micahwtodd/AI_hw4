import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../api'
import { readRecent, type RecentItem } from '../recent'

export function RecentViewed() {
  const [items, setItems] = useState<RecentItem[]>(() => readRecent())

  useEffect(() => {
    function refresh() {
      setItems(readRecent())
    }
    window.addEventListener('campus-recent', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('campus-recent', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  if (items.length === 0) return null

  return (
    <section className="recent-window" aria-label="Recently viewed">
      <h2>Recently viewed</h2>
      <div className="recent-grid">
        {items.map((item) => (
          <Link key={item.product_id} className="recent-card" to={`/products/${item.product_id}`}>
            <img src={item.image_url} alt="" />
            <span>
              <strong>{item.name}</strong>
              <span>{formatPrice(item.price)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
