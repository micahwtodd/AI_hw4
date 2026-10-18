export type RecentItem = {
  product_id: string
  name: string
  price: number
  image_url: string
  garment_type: string
}

const STORAGE_KEY = 'campus-customs-recent'
const MAX_RECENT = 4

export function readRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is RecentItem =>
        !!item &&
        typeof item === 'object' &&
        typeof item.product_id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.price === 'number' &&
        typeof item.image_url === 'string' &&
        typeof item.garment_type === 'string',
    ).slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

export function rememberProduct(item: RecentItem) {
  const next = [item, ...readRecent().filter((saved) => saved.product_id !== item.product_id)].slice(0, MAX_RECENT)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event('campus-recent'))
}
