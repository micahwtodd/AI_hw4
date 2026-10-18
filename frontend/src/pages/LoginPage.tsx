import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email, password)
      navigate('/products')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Email or password is incorrect.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page narrow">
      <p className="eyebrow">Account</p>
      <h1>Log in</h1>
      <form className="account-form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Checking…' : 'Log in'}
        </button>
        {error && <p className="status error">{error}</p>}
      </form>
      <p className="account-switch">
        New here? <Link to="/create-account">Create an account</Link>
      </p>
    </section>
  )
}
