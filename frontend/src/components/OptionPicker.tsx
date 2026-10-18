import { useState } from 'react'
import { formatPrice } from '../api'
import { useCart } from '../cart'
import type { ProductSummary } from '../types'

export function OptionPicker({ product, compact = false }: { product: ProductSummary; compact?: boolean }) {
  const { addItem, roomFor } = useCart()
  const [size, setSize] = useState('')
  const [color, setColor] = useState(product.colors[0] ?? '')
  const [note, setNote] = useState('')
  const selected = product.inventory.find((item) => item.size === size)
  const room = selected ? roomFor(product.product_id, size, selected.quantity) : 0
  const inCart = selected ? selected.quantity - room : 0

  function add() {
    if (!selected) {
      setNote('Choose a size.')
      return
    }
    const result = addItem({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      size: selected.size,
      color,
      stock: selected.quantity,
    })
    setNote(
      result === 'added'
        ? `Added. ${Math.max(0, room - 1)} left in size ${selected.size}.`
        : `Only ${selected.quantity} in size ${selected.size}.`,
    )
  }

  return (
    <div className={compact ? 'choose-options' : 'option-picker'}>
      <p className="choose-title">{compact ? 'Choose options' : 'Choose a color and size'}</p>
      <p className="choose-price">{formatPrice(product.price)}</p>
      <fieldset>
        <legend>Color</legend>
        {product.colors.length === 0 && <p className="choose-empty">Colors were not recorded for this item.</p>}
        <div className="choice-row">
          {product.colors.map((item) => (
            <button
              key={item}
              type="button"
              className={color === item ? 'selected' : ''}
              aria-pressed={color === item}
              onClick={() => setColor(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Size</legend>
        <div className="choice-row">
          {product.inventory.map((item) => (
            <button
              key={item.size}
              type="button"
              className={size === item.size ? 'selected' : ''}
              aria-pressed={size === item.size}
              disabled={item.quantity === 0 || roomFor(product.product_id, item.size, item.quantity) === 0}
              onClick={() => {
                setSize(item.size)
                setNote('')
              }}
            >
              {item.size}
              <small>{item.quantity === 0 ? 'Out' : item.quantity}</small>
            </button>
          ))}
        </div>
      </fieldset>
      {selected && (
        <p className="choose-note">
          {room} left in size {selected.size}
          {color ? ` for ${color}` : ''}
          {inCart > 0 ? `, with ${inCart} already in your cart` : ''}. Stock is counted by size for this item.
        </p>
      )}
      <button type="button" className="add-cart" onClick={add} disabled={Boolean(selected) && room === 0}>
        {selected && room === 0 ? 'No more in this size' : 'Add to cart'}
      </button>
      {note && (
        <p className="choose-note" role="status">
          {note}
        </p>
      )}
    </div>
  )
}
