import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProduct, formatPrice } from '../api'
import { OptionPicker } from '../components/OptionPicker'
import { rememberProduct } from '../recent'
import type { ProductDetail } from '../types'

export function ProductPage() {
  const { productId = '' } = useParams()
  const [loadedId, setLoadedId] = useState('')
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchProduct(productId)
      .then((row) => {
        if (!active) return
        setLoadedId(productId)
        setProduct(row)
        setError('')
      })
      .catch((reason: unknown) => {
        if (!active) return
        setLoadedId(productId)
        setProduct(null)
        setError(reason instanceof Error ? reason.message : 'This product could not be loaded.')
      })
    return () => {
      active = false
    }
  }, [productId])

  const ready = loadedId === productId
  const visibleProduct = ready ? product : null
  const visibleError = ready ? error : ''

  useEffect(() => {
    if (!visibleProduct) return
    rememberProduct({
      product_id: visibleProduct.product_id,
      name: visibleProduct.name,
      price: visibleProduct.price,
      image_url: visibleProduct.image_url,
      garment_type: visibleProduct.garment_type,
    })
  }, [visibleProduct])

  return (
    <section className="page">
      <Link className="back-link" to="/products">
        Back to products
      </Link>
      {visibleError && <p className="status error">{visibleError}</p>}
      {!visibleError && !visibleProduct && <p className="status">Loading this product…</p>}
      {visibleProduct && (
        <article className="product-detail">
          <img src={visibleProduct.image_url} alt={visibleProduct.name} />
          <div className="product-copy">
            <p className="garment-type">{visibleProduct.garment_type}</p>
            <h1>{visibleProduct.name}</h1>
            <p className="price">{formatPrice(visibleProduct.price)}</p>
            <p className="description">{visibleProduct.description}</p>
            <OptionPicker product={visibleProduct} />
          </div>
        </article>
      )}
    </section>
  )
}
