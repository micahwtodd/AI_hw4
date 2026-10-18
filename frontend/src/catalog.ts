import type { ProductSummary } from './types'

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

export const CATEGORIES = ['T-shirts', 'Sweatshirts', 'Hoodies', 'Quarter-zips', 'Jackets', 'Other'] as const

export const PRICE_BANDS = [
  { id: 'under-50', label: 'Under $50', test: (price: number) => price < 50 },
  { id: '50-74', label: '$50–$74', test: (price: number) => price >= 50 && price < 75 },
  { id: '75-up', label: '$75 and up', test: (price: number) => price >= 75 },
] as const

export const COLOR_GROUPS = ['Navy', 'Gray', 'White', 'Red', 'Coral'] as const

export function categoryOf(garmentType: string): string {
  const value = garmentType.toLowerCase()
  if (value.includes('hood')) return 'Hoodies'
  if (value.includes('quarter') || value.includes('1/4') || value.includes('1 4')) return 'Quarter-zips'
  if (value.includes('jacket') || value.includes('bomber')) return 'Jackets'
  if (value.includes('t-shirt') || value.includes('t shirt')) return 'T-shirts'
  if (value.includes('crew') || value.includes('mockneck') || value.includes('raglan') || value.includes('sweatshirt')) {
    return 'Sweatshirts'
  }
  return 'Other'
}

export function colorGroups(colors: string[]): string[] {
  const groups = new Set<string>()
  for (const color of colors) {
    const value = color.toLowerCase()
    if (value.includes('navy') || value.includes('blue')) groups.add('Navy')
    else if (value.includes('coral') || value.includes('pink')) groups.add('Coral')
    else if (value.includes('red')) groups.add('Red')
    else if (value.includes('white') || value.includes('ivory') || value.includes('cream')) groups.add('White')
    else if (value.includes('gray') || value.includes('grey') || value.includes('charcoal') || value.includes('heather')) {
      groups.add('Gray')
    }
  }
  return [...groups]
}

export function inStock(product: ProductSummary, size: string): boolean {
  return product.inventory.some((item) => item.size === size && item.quantity > 0)
}

export function totalStock(product: ProductSummary): number {
  return product.inventory.reduce((sum, item) => sum + item.quantity, 0)
}

export type CatalogSort =
  | 'catalogue'
  | 'price-asc'
  | 'price-desc'
  | 'color-asc'
  | 'color-desc'
  | 'size-asc'
  | 'size-desc'
  | 'stock-asc'
  | 'stock-desc'

const SIZE_RANK: Record<string, number> = { XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5 }

function sizeKey(product: ProductSummary, direction: 'asc' | 'desc'): number {
  const available = product.inventory
    .filter((item) => item.quantity > 0)
    .map((item) => SIZE_RANK[item.size] ?? 9)
  if (available.length === 0) return 1000
  if (direction === 'asc') return Math.min(...available)
  return -Math.max(...available)
}

export function compareProducts(left: ProductSummary, right: ProductSummary, sort: CatalogSort): number {
  if (sort === 'price-asc') return left.price - right.price
  if (sort === 'price-desc') return right.price - left.price
  if (sort === 'color-asc' || sort === 'color-desc') {
    const colorOf = (product: ProductSummary) => [...product.colors].sort()[0]?.toLowerCase() ?? '\uffff'
    const delta = colorOf(left).localeCompare(colorOf(right))
    return sort === 'color-asc' ? delta : -delta
  }
  if (sort === 'size-asc' || sort === 'size-desc') return sizeKey(left, sort === 'size-asc' ? 'asc' : 'desc') - sizeKey(right, sort === 'size-asc' ? 'asc' : 'desc')
  if (sort === 'stock-asc') return totalStock(left) - totalStock(right)
  if (sort === 'stock-desc') return totalStock(right) - totalStock(left)
  return 0
}

export type CatalogFilters = {
  query: string
  categories: string[]
  sizes: string[]
  prices: string[]
  colors: string[]
}

export function productMatches(product: ProductSummary, filters: CatalogFilters, ignore?: keyof CatalogFilters): boolean {
  const query = filters.query.trim().toLowerCase()
  if (query) {
    const haystack = [product.name, product.garment_type, product.description, ...product.colors]
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(query)) return false
  }
  if (ignore !== 'categories' && filters.categories.length > 0 && !filters.categories.includes(categoryOf(product.garment_type))) {
    return false
  }
  if (ignore !== 'sizes' && filters.sizes.length > 0 && !filters.sizes.some((size) => inStock(product, size))) {
    return false
  }
  if (ignore !== 'prices' && filters.prices.length > 0) {
    const matched = PRICE_BANDS.some((band) => filters.prices.includes(band.id) && band.test(product.price))
    if (!matched) return false
  }
  if (ignore !== 'colors' && filters.colors.length > 0 && !colorGroups(product.colors).some((color) => filters.colors.includes(color))) {
    return false
  }
  return true
}
