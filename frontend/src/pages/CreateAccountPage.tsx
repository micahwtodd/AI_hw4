import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export function CreateAccountPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await signup({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        confirm_password: confirmPassword,
      })
      navigate('/products')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The account could not be created.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page narrow">
      <p className="eyebrow">Account</p>
      <h1>Create Account</h1>
      <form className="account-form" onSubmit={onSubmit}>
        <label>
          First name
          <input
            type="text"
            name="first_name"
            autoComplete="given-name"
            value={firstName}
            required
            onChange={(event) => setFirstName(event.target.value)}
          />
        </label>
        <label>
          Last name
          <input
            type="text"
            name="last_name"
            autoComplete="family-name"
            value={lastName}
            required
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
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
            autoComplete="new-password"
            value={password}
            required
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            name="confirm_password"
            autoComplete="new-password"
            value={confirmPassword}
            required
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
        {error && <p className="status error">{error}</p>}
      </form>
      <p className="account-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  )
}
