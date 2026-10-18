import type { ProductDetail, ProductSummary } from './types'

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export async function fetchProducts(): Promise<ProductSummary[]> {
  const response = await fetch('/api/products')
  if (!response.ok) {
    throw new Error('The catalogue could not be loaded.')
  }
  return response.json()
}

export async function fetchProduct(productId: string): Promise<ProductDetail> {
  const response = await fetch(`/api/products/${encodeURIComponent(productId)}`)
  if (response.status === 404) {
    throw new Error('This product is not in the catalogue.')
  }
  if (!response.ok) {
    throw new Error('This product could not be loaded.')
  }
  return response.json()
}

export type Account = {
  id: number
  name: string
  first_name: string | null
  last_name: string | null
  email: string
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body.detail === 'string') return body.detail
  } catch {
    // The response was not JSON.
  }
  return 'Something went wrong. Please try again.'
}

export async function fetchAccount(): Promise<Account | null> {
  const response = await fetch('/api/me', { credentials: 'same-origin' })
  if (response.status === 401) return null
  if (!response.ok) throw new Error(await errorMessage(response))
  return response.json()
}

export async function loginAccount(email: string, password: string): Promise<Account> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error(await errorMessage(response))
  return response.json()
}

export async function createAccount(input: {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
}): Promise<Account> {
  const response = await fetch('/api/account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error(await errorMessage(response))
  return response.json()
}

export async function logoutAccount(): Promise<void> {
  await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
}
