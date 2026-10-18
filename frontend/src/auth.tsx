import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createAccount, fetchAccount, loginAccount, logoutAccount, type Account } from './api'

type AuthValue = {
  account: Account | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (input: {
    first_name: string
    last_name: string
    email: string
    password: string
    confirm_password: string
  }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    fetchAccount()
      .then((next) => {
        if (active) setAccount(next)
      })
      .catch(() => {
        if (active) setAccount(null)
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  async function login(email: string, password: string) {
    setAccount(await loginAccount(email, password))
  }

  async function signup(input: {
    first_name: string
    last_name: string
    email: string
    password: string
    confirm_password: string
  }) {
    setAccount(await createAccount(input))
  }

  async function logout() {
    await logoutAccount()
    setAccount(null)
  }

  return <AuthContext.Provider value={{ account, ready, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
