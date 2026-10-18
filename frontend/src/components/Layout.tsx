import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { CartButton } from './CartButton'
import { ChatResults } from './ChatResults'
import { ChatWidget } from './ChatWidget'
import { RecentViewed } from './RecentViewed'

const shopLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Products', end: false },
  { to: '/about', label: 'About Us', end: false },
]

export function Layout() {
  const { account, logout } = useAuth()
  const navigate = useNavigate()
  const [accountOpen, setAccountOpen] = useState(false)
  const accountMenu = useRef<HTMLDivElement>(null)
  const greetingName = account?.first_name || account?.name || 'there'

  useEffect(() => {
    if (!accountOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setAccountOpen(false)
    }
    function onPointer(event: MouseEvent) {
      if (!accountMenu.current?.contains(event.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [accountOpen])

  async function onLogout() {
    setAccountOpen(false)
    await logout()
    navigate('/', { state: { notice: 'You have been logged out.' } })
  }

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink className="brand" to="/" aria-label="Yale, Campus Customs home">
            <span className="yale-logo">
              <span>Yale</span>
              <small>University</small>
            </span>
            <span className="brand-rule" aria-hidden="true" />
            <span>
              <strong>Campus Customs</strong>
              <small>Yale gear</small>
            </span>
          </NavLink>
          <nav className="site-nav" aria-label="Main">
            {shopLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                {link.label}
              </NavLink>
            ))}
            {account ? (
              <>
                <div className="account-menu" ref={accountMenu}>
                  <button
                    type="button"
                    className="nav-link nav-button nav-user"
                    aria-expanded={accountOpen}
                    onClick={() => setAccountOpen((open) => !open)}
                  >
                    {greetingName}
                  </button>
                  {accountOpen && (
                    <div className="account-card" role="dialog" aria-labelledby="account-info-title">
                      <h2 id="account-info-title" className="account-heading">
                        Account info
                      </h2>
                      <p className="account-hello">Hi {greetingName}, how are you doing?</p>
                      <dl>
                        <div>
                          <dt>First name</dt>
                          <dd>{account.first_name || 'Not on file'}</dd>
                        </div>
                        <div>
                          <dt>Last name</dt>
                          <dd>{account.last_name || 'Not on file'}</dd>
                        </div>
                        <div>
                          <dt>Email</dt>
                          <dd>{account.email}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
                <button type="button" className="nav-link nav-button" onClick={() => void onLogout()}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/create-account"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Create Account
                </NavLink>
              </>
            )}
          </nav>
          <CartButton />
        </div>
      </header>
      <main className="site-main">
        <RecentViewed />
        <ChatResults />
        <Outlet />
      </main>
      <footer className="site-footer">Campus Customs</footer>
      <ChatWidget />
    </div>
  )
}
