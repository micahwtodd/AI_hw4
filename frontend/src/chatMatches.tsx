import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ProductCard } from './types'

type ChatMatchSet = {
  question: string
  products: ProductCard[]
}

type ChatMatchesValue = ChatMatchSet & {
  show: (question: string, products: ProductCard[]) => void
  clear: () => void
}

const empty: ChatMatchSet = { question: '', products: [] }
const ChatMatchesContext = createContext<ChatMatchesValue | null>(null)

export function ChatMatchesProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<ChatMatchSet>(empty)
  const value: ChatMatchesValue = {
    ...matches,
    show(question, products) {
      if (products.length === 0) return
      setMatches({ question, products })
    },
    clear() {
      setMatches(empty)
    },
  }
  return <ChatMatchesContext.Provider value={value}>{children}</ChatMatchesContext.Provider>
}

export function useChatMatches(): ChatMatchesValue {
  const value = useContext(ChatMatchesContext)
  if (!value) throw new Error('useChatMatches must be used inside ChatMatchesProvider')
  return value
}
