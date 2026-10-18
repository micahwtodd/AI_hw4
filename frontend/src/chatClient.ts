import type { ProductCard } from './types'

export type ChatTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatReply = {
  reply: string
  products: ProductCard[]
}

export type StoredChatMessage = {
  role: 'user' | 'assistant'
  content: string
  products: ProductCard[]
}

export async function fetchChatHistory(): Promise<StoredChatMessage[]> {
  const response = await fetch('/api/chat/history', { credentials: 'same-origin' })
  if (!response.ok) return []
  const body: unknown = await response.json()
  if (!Array.isArray(body)) return []
  return body.filter(
    (item): item is StoredChatMessage =>
      !!item &&
      typeof item === 'object' &&
      (item.role === 'user' || item.role === 'assistant') &&
      typeof item.content === 'string' &&
      Array.isArray(item.products),
  )
}

export async function clearChatHistory(): Promise<void> {
  const response = await fetch('/api/chat/clear', { method: 'POST', credentials: 'same-origin' })
  if (!response.ok) {
    throw new Error('Chat history could not be cleared.')
  }
}

export class ChatLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChatLimitError'
  }
}

export async function streamShopperMessage(
  message: string,
  history: ChatTurn[],
  onText: (reply: string) => void,
  signal?: AbortSignal,
): Promise<ChatReply> {
  const trimmed = message.trim()
  if (!trimmed) {
    return { reply: 'Type a message to ask about Campus Customs gear.', products: [] }
  }
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    credentials: 'same-origin',
    body: JSON.stringify({ message: trimmed, history, page: window.location.pathname }),
    signal,
  })
  if (response.status === 429) {
    let detail = "You've reached 50 messages this hour. Please wait before sending more."
    try {
      const body = await response.json()
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      // The limit response was not JSON.
    }
    throw new ChatLimitError(detail)
  }
  if (!response.ok || !response.body) {
    let detail = 'The shopping assistant could not answer.'
    try {
      const body = await response.json()
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      // The response was not JSON.
    }
    throw new Error(detail)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let reply = ''
  let products: ProductCard[] = []
  let finished = false

  const take = (block: string) => {
    for (const line of block.split('\n')) {
      const trimmedLine = line.trim()
      if (!trimmedLine.startsWith('data:')) continue
      const payload: unknown = JSON.parse(trimmedLine.slice(5).trim())
      if (!payload || typeof payload !== 'object') continue
      const event = payload as { kind?: string; reply?: string; detail?: string; products?: ProductCard[] }
      if (event.kind === 'text' && typeof event.reply === 'string') {
        reply = event.reply
        onText(reply)
      } else if (event.kind === 'done' && typeof event.reply === 'string') {
        reply = event.reply
        products = Array.isArray(event.products) ? event.products : []
        finished = true
        onText(reply)
      } else if (event.kind === 'error') {
        throw new Error(typeof event.detail === 'string' ? event.detail : 'The shopping assistant could not answer.')
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''
    for (const block of blocks) take(block)
  }
  if (buffer.trim()) take(buffer)
  if (!finished && !reply) {
    throw new Error('The shopping assistant could not answer.')
  }
  return { reply, products }
}
