export type ProductSummary = {
  product_id: string
  name: string
  garment_type: string
  description: string
  price: number
  image_url: string
  colors: string[]
  inventory: InventorySize[]
}

export type InventorySize = {
  size: string
  quantity: number
}

export type ProductDetail = ProductSummary

export type ProductCard = {
  product_id: string
  name: string
  price: number
  garment_type: string
  image_url: string
  total_stock: number
  colors?: string[]
}
