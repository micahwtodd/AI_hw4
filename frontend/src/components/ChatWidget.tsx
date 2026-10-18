import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../api'
import { useAuth } from '../auth'
import { ChatLimitError, clearChatHistory, fetchChatHistory, streamShopperMessage, type ChatTurn } from '../chatClient'
import { useChatMatches } from '../chatMatches'
import type { ProductCard } from '../types'

type ChatLine = {
  id: number
  role: 'user' | 'assistant'
  content: string
  products?: ProductCard[]
}

const opening: ChatLine = {
  id: 0,
  role: 'assistant',
  content: 'Ask about Yale gear. I can help with price and what is in stock.',
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [lines, setLines] = useState<ChatLine[]>([opening])
  const [sending, setSending] = useState(false)
  const [writing, setWriting] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [limitNotice, setLimitNotice] = useState('')
  const [clearError, setClearError] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const threadRef = useRef(0)
  const { show: showOnPage } = useChatMatches()
  const { account, ready } = useAuth()

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [lines, open, sending])

  useEffect(() => {
    if (!ready) return
    if (!account) {
      setLines([opening])
      return
    }
    let active = true
    fetchChatHistory()
      .then((saved) => {
        if (!active) return
        setLines([
          opening,
          ...saved.map((message, index) => ({
            id: index + 1,
            role: message.role,
            content: message.content,
            products: message.products,
          })),
        ])
      })
      .catch(() => {
        if (active) setLines([opening])
      })
    return () => {
      active = false
    }
  }, [account, ready])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const message = draft.trim()
    if (!message || sending) return
    const history: ChatTurn[] = lines
      .filter((line) => line.id !== opening.id)
      .map((line) => {
        const shown = line.products?.map((product) => product.name).join(", ")
        const content = shown ? `${line.content}\nProducts shown: ${shown}` : line.content
        return { role: line.role, content }
      })
    const userLine: ChatLine = { id: Date.now(), role: 'user', content: message }
    setLines((current) => [...current, userLine])
    setDraft('')
    setLimitNotice('')
    setSending(true)
    setWriting(false)
    const controller = new AbortController()
    abortRef.current = controller
    const thread = threadRef.current
    let assistantId = 0
    try {
      const reply = await streamShopperMessage(
        message,
        history,
        (text) => {
          if (threadRef.current !== thread) return
          setWriting(true)
          if (!assistantId) {
            assistantId = Date.now() + 1
            setLines((current) => [...current, { id: assistantId, role: 'assistant', content: text }])
            return
          }
          setLines((current) =>
            current.map((line) => (line.id === assistantId ? { ...line, content: text } : line)),
          )
        },
        controller.signal,
      )
      if (controller.signal.aborted || threadRef.current !== thread) return
      showOnPage(message, reply.products)
      setLines((current) => {
        if (!assistantId) {
          return [...current, { id: Date.now() + 1, role: 'assistant', content: reply.reply, products: reply.products }]
        }
        return current.map((line) =>
          line.id === assistantId ? { ...line, content: reply.reply, products: reply.products } : line,
        )
      })
    } catch (caught) {
      if (controller.signal.aborted || threadRef.current !== thread) return
      if (caught instanceof ChatLimitError) {
        setLimitNotice(caught.message)
        return
      }
      const content = caught instanceof Error ? caught.message : 'The shopping assistant could not answer.'
      setLines((current) => [...current, { id: Date.now() + 1, role: 'assistant', content }])
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setSending(false)
      setWriting(false)
    }
  }

  async function confirmClearHistory() {
    threadRef.current += 1
    abortRef.current?.abort()
    setClearError('')
    try {
      await clearChatHistory()
      setLines([opening])
      setLimitNotice('')
      setConfirmClear(false)
    } catch (caught) {
      setClearError(caught instanceof Error ? caught.message : 'Chat history could not be cleared.')
    }
  }

  return (
    <div className="chat-dock">
      {open && (
        <section className="chat-panel" aria-label="Campus Customs chat">
          <header className="chat-header">
            <div>
              <strong>Campus Customs</strong>
              <p>Shopping assistant</p>
            </div>
            <button type="button" className="chat-close" onClick={() => setOpen(false)}>
              Close
            </button>
          </header>
          <button type="button" className="chat-clear" onClick={() => setConfirmClear(true)}>
            Clear chat history
          </button>
          {limitNotice && (
            <p className="chat-limit" role="status">
              {limitNotice}
            </p>
          )}
          <div className="chat-log" ref={logRef}>
            {lines.map((line) => (
              <div key={line.id} className={`chat-entry ${line.role}`}>
                <p className={`chat-line ${line.role}`}>{line.content}</p>
                {line.products && line.products.length > 0 && (
                  <div className="chat-products">
                    {line.products.map((product) => (
                      <Link key={product.product_id} className="chat-product" to={`/products/${product.product_id}`}>
                        <img src={product.image_url} alt="" />
                        <span>
                          <strong>{product.name}</strong>
                          <span>
                            {formatPrice(product.price)} · {product.total_stock} in stock
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <form className="chat-form" onSubmit={onSubmit}>
            <label className="visually-hidden" htmlFor="chat-message">
              Message
            </label>
            <input
              id="chat-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about a product"
            />
            <button type="submit" disabled={sending}>
              {sending ? (writing ? 'Writing…' : 'Sending…') : 'Send'}
            </button>
          </form>
          {confirmClear && (
            <div className="chat-warn" role="alertdialog" aria-labelledby="clear-chat-title">
              <div className="chat-warn-card">
                <h2 id="clear-chat-title">Clear chat history?</h2>
                <p>
                  This removes the conversation from this screen. If you are logged in, it also deletes your saved
                  chat history in the database. This cannot be undone.
                </p>
                {clearError && <p className="status error">{clearError}</p>}
                <div className="chat-warn-actions">
                  <button type="button" onClick={() => void confirmClearHistory()}>
                    Clear chat history
                  </button>
                  <button type="button" className="chat-warn-cancel" onClick={() => setConfirmClear(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
      {!open && (
        <button type="button" className="dan-invite" onClick={() => setOpen(true)}>
          <span className="dan-name">Handsome Dan</span>
          <span className="dan-bubble">Need help? Let's chat!</span>
          <img src="/handsome-dan.svg" alt="" />
        </button>
      )}
      <button
        type="button"
        className="chat-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Chat
      </button>
    </div>
  )
}

