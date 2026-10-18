import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { fetchProducts, formatPrice } from '../api'
import {
  CATEGORIES,
  COLOR_GROUPS,
  PRICE_BANDS,
  SIZES,
  categoryOf,
  colorGroups,
  compareProducts,
  inStock,
  productMatches,
  type CatalogFilters,
  type CatalogSort,
} from '../catalog'
import { CampusPhoto } from '../components/CampusPhoto'
import { OptionPicker } from '../components/OptionPicker'
import type { ProductSummary } from '../types'

const emptyFilters: CatalogFilters = {
  query: '',
  categories: [],
  sizes: [],
  prices: [],
  colors: [],
}

function CatalogCard({ product, view }: { product: ProductSummary; view: 'grid' | 'list' }) {
  const [open, setOpen] = useState(false)
  const closeButton = useRef<HTMLButtonElement>(null)
  const titleId = `options-${product.product_id}`

  useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <article className="catalog-card">
      <div className="catalog-photo">
        <Link to={`/products/${product.product_id}`}>
          <img src={product.image_url} alt="" />
        </Link>
      </div>
      <Link className="catalog-copy" to={`/products/${product.product_id}`}>
        <div className="product-card-body">
          <h2>{product.name}</h2>
          <p className="price">{formatPrice(product.price)}</p>
          {view === 'list' && <p className="card-blurb">{product.description}</p>}
          <p className="garment-type">{product.garment_type}</p>
        </div>
      </Link>
      <button type="button" className="choose-launch" onClick={() => setOpen(true)}>
        Choose options
      </button>
      {open &&
        createPortal(
          <div className="option-shade" onMouseDown={() => setOpen(false)}>
            <div
              className="option-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                ref={closeButton}
                type="button"
                className="option-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
              <img src={product.image_url} alt="" />
              <h2 id={titleId}>{product.name}</h2>
              <OptionPicker product={product} />
            </div>
          </div>,
          document.body,
        )}
    </article>
  )
}

function toggle(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

export function ProductsPage() {
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [filters, setFilters] = useState<CatalogFilters>(emptyFilters)
  const [sort, setSort] = useState<CatalogSort>('catalogue')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    let active = true
    fetchProducts()
      .then((rows) => {
        if (!active) return
        setProducts(rows)
        setReady(true)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : 'The catalogue could not be loaded.')
        setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  const visible = useMemo(
    () => products.filter((product) => productMatches(product, filters)),
    [products, filters],
  )
  const sorted = useMemo(() => {
    return visible
      .map((product, index) => ({ product, index }))
      .sort((left, right) => compareProducts(left.product, right.product, sort) || left.index - right.index)
      .map((item) => item.product)
  }, [visible, sort])

  const chips = [
    ...(filters.query.trim() ? [{ key: 'query', label: `Search: ${filters.query.trim()}` }] : []),
    ...filters.categories.map((value) => ({ key: `category:${value}`, label: value })),
    ...filters.sizes.map((value) => ({ key: `size:${value}`, label: `Size ${value}` })),
    ...filters.prices.map((value) => ({
      key: `price:${value}`,
      label: PRICE_BANDS.find((band) => band.id === value)?.label ?? value,
    })),
    ...filters.colors.map((value) => ({ key: `color:${value}`, label: value })),
  ]

  function removeChip(key: string) {
    if (key === 'query') {
      setFilters((current) => ({ ...current, query: '' }))
      return
    }
    const [kind, value] = key.split(':')
    const field = kind === 'category' ? 'categories' : kind === 'size' ? 'sizes' : kind === 'price' ? 'prices' : 'colors'
    setFilters((current) => ({ ...current, [field]: current[field].filter((item) => item !== value) }))
  }

  function countFor(ignore: keyof CatalogFilters, test: (product: ProductSummary) => boolean) {
    return products.filter((product) => productMatches(product, filters, ignore) && test(product)).length
  }

  return (
    <section className="page">
      <CampusPhoto />
      <div className="page-heading">
        <p className="eyebrow">Catalogue</p>
        <h1>Products</h1>
        {ready && !error && (
          <p className="result-count">
            {visible.length} of {products.length} items
          </p>
        )}
      </div>
      {error && <p className="status error">{error}</p>}
      {!ready && !error && <p className="status">Loading the catalogue…</p>}
      {ready && !error && (
        <div className="catalog-layout">
          <aside className="filters" aria-label="Filter products">
            <label className="filter-search">
              Search
              <input
                type="search"
                value={filters.query}
                placeholder="Name, team, or color"
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              />
            </label>

            <fieldset>
              <legend>Category</legend>
              {CATEGORIES.map((category) => (
                <label key={category} className="check-row">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() =>
                      setFilters((current) => ({ ...current, categories: toggle(current.categories, category) }))
                    }
                  />
                  <span>{category}</span>
                  <small>{countFor('categories', (product) => categoryOf(product.garment_type) === category)}</small>
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>Size in stock</legend>
              <div className="size-filter">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={filters.sizes.includes(size) ? 'selected' : ''}
                    aria-pressed={filters.sizes.includes(size)}
                    onClick={() => setFilters((current) => ({ ...current, sizes: toggle(current.sizes, size) }))}
                  >
                    {size}
                    <small>{countFor('sizes', (product) => inStock(product, size))}</small>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Price</legend>
              {PRICE_BANDS.map((band) => (
                <label key={band.id} className="check-row">
                  <input
                    type="checkbox"
                    checked={filters.prices.includes(band.id)}
                    onChange={() => setFilters((current) => ({ ...current, prices: toggle(current.prices, band.id) }))}
                  />
                  <span>{band.label}</span>
                  <small>{countFor('prices', (product) => band.test(product.price))}</small>
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>Color</legend>
              {COLOR_GROUPS.map((color) => (
                <label key={color} className="check-row">
                  <input
                    type="checkbox"
                    checked={filters.colors.includes(color)}
                    onChange={() => setFilters((current) => ({ ...current, colors: toggle(current.colors, color) }))}
                  />
                  <span>{color}</span>
                  <small>{countFor('colors', (product) => colorGroups(product.colors).includes(color))}</small>
                </label>
              ))}
            </fieldset>
          </aside>

          <div>
            {chips.length > 0 && (
              <div className="applied-filters">
                {chips.map((chip) => (
                  <button key={chip.key} type="button" onClick={() => removeChip(chip.key)}>
                    {chip.label} <span aria-hidden="true">×</span>
                    <span className="visually-hidden">Remove {chip.label}</span>
                  </button>
                ))}
                <button type="button" className="clear-filters" onClick={() => setFilters(emptyFilters)}>
                  Clear all
                </button>
              </div>
            )}
            {visible.length === 0 && <p className="status">No items match these filters.</p>}
            <div className="catalog-toolbar">
              <label>
                Sort
                <select value={sort} onChange={(event) => setSort(event.target.value as CatalogSort)}>
                  <option value="catalogue">Catalogue order</option>
                  <option value="price-asc">Price, low to high</option>
                  <option value="price-desc">Price, high to low</option>
                  <option value="color-asc">Color, A to Z</option>
                  <option value="color-desc">Color, Z to A</option>
                  <option value="size-asc">Size, smallest in stock first</option>
                  <option value="size-desc">Size, largest in stock first</option>
                  <option value="stock-desc">Quantity in stock, most first</option>
                  <option value="stock-asc">Quantity in stock, fewest first</option>
                </select>
              </label>
              <div className="view-toggle" role="group" aria-label="Product view">
                <button type="button" aria-pressed={view === 'grid'} aria-label="Grid view" onClick={() => setView('grid')}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path fill="currentColor" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                  </svg>
                </button>
                <button type="button" aria-pressed={view === 'list'} aria-label="List view" onClick={() => setView('list')}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path fill="currentColor" d="M4 5h4v4H4V5zm6 0h10v4H10V5zM4 10h4v4H4v-4zm6 0h10v4H10v-4zM4 15h4v4H4v-4zm6 0h10v4H10v-4z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={view === 'list' ? 'product-list' : 'product-grid'}>
              {sorted.map((product) => (
                <CatalogCard key={product.product_id} product={product} view={view} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
