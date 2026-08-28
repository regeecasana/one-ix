import { useEffect, useRef, useState } from 'react'
import { useClient } from '../hooks/useClient'
import * as api from '../../lib/api'
import { ApiError } from '../../lib/api'
import { formatCents, minutesUntil, timeAgo } from '../../lib/format'

function TicketSideBar() {
  const client = useClient()

  const [phase, setPhase] = useState('loading')
  const [errorMessage, setErrorMessage] = useState(null)
  const [ticketId, setTicketId] = useState(null)
  const [requesterEmail, setRequesterEmail] = useState(null)
  const [customerId, setCustomerId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [products, setProducts] = useState([])
  const [ticketClosed, setTicketClosed] = useState(false)
  const [notLinked, setNotLinked] = useState(false)

  const bodyRef = useRef(null)

  async function loadByCustomerId(custId) {
    const p = await api.getCustomerProfile(client, custId)
    setCustomerId(custId)
    setProfile(p)
    setNotLinked(false)
  }

  async function loadByEmail(email) {
    const p = await api.getCustomerProfileByEmail(client, email)
    setCustomerId(p.customer.id)
    setProfile(p)
    setNotLinked(false)
  }

  useEffect(() => {
    ;(async () => {
      try {
        const [ticketData, requesterData] = await Promise.all([
          client.get('ticket.id'),
          // Not every ticket has a requester (e.g. some internal/test
          // tickets) -- tolerate that rather than failing the whole app.
          client.get('ticket.requester.email').catch(() => ({}))
        ])

        const currentTicketId = String(ticketData['ticket.id'] ?? '')
        if (!currentTicketId) throw new Error("Couldn't read the current ticket id.")
        setTicketId(currentTicketId)

        const currentRequesterEmail = requesterData['ticket.requester.email']
          ? String(requesterData['ticket.requester.email'])
          : null
        setRequesterEmail(currentRequesterEmail)

        const catalog = await api.listProducts(client).catch(() => [])
        setProducts(catalog)

        try {
          const { customerId: custId } = await api.getCustomerIdForTicket(client, currentTicketId)
          await loadByCustomerId(custId)
        } catch (err) {
          if (!(err instanceof ApiError && err.status === 404)) throw err
          // This ticket was never linked to a customer (e.g. created
          // outside the demo flow) -- fall back to the requester's email,
          // which the agent can also override via the search box below.
          setNotLinked(true)
          if (currentRequesterEmail) {
            await loadByEmail(currentRequesterEmail).catch(() => {})
          }
        }

        setPhase('ready')
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
        setPhase('error')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ticket sidebar iframes render at a fixed height by default -- keep the
  // real one in sync with content so nothing scrolls inside a cramped box.
  useEffect(() => {
    if (bodyRef.current) {
      client
        .invoke('resize', { width: '100%', height: `${Math.ceil(bodyRef.current.scrollHeight + 20)}px` })
        .catch(() => {})
    }
  })

  async function handleCloseTicket() {
    if (!ticketId) return
    await api.closeTicket(client, ticketId)
    setTicketClosed(true)
  }

  return (
    <div ref={bodyRef} className="app">
      {phase === 'loading' && <p className="muted">Loading customer activity…</p>}

      {phase === 'error' && <p className="error-text">{errorMessage}</p>}

      {phase === 'ready' && (
        <>
          <EmailSearch
            client={client}
            defaultEmail={requesterEmail ?? ''}
            onFound={(p) => {
              setCustomerId(p.customer.id)
              setProfile(p)
              setNotLinked(false)
            }}
          />

          {!profile && notLinked && (
            <p className="muted">No customer activity is linked to this ticket. Search by email above.</p>
          )}

          {profile && customerId && (
            <>
              <CustomerHeader profile={profile} />
              <SetupSummary profile={profile} />
              <VoucherSection
                client={client}
                customerId={customerId}
                profile={profile}
                products={products}
                onChanged={() => loadByCustomerId(customerId)}
              />
              <InsightSection client={client} customerId={customerId} />
              <ActivityList profile={profile} />
            </>
          )}

          <div className="footer">
            {ticketClosed ? (
              <span className="pill pill-muted">Ticket closed</span>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={handleCloseTicket}>
                Close ticket
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function EmailSearch({ client, defaultEmail, onFound }) {
  const [email, setEmail] = useState(defaultEmail)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError(null)
    try {
      const profile = await api.getCustomerProfileByEmail(client, email.trim())
      onFound(profile)
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404 ? 'No customer with that email.' : 'Search failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="section" onSubmit={handleSearch}>
      <label className="field-label" htmlFor="email-search">
        Find customer by email
      </label>
      <div className="search-row">
        <input
          id="email-search"
          type="email"
          className="select"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="customer@example.com"
        />
        <button type="submit" className="btn btn-ghost" disabled={busy || !email.trim()}>
          {busy ? '…' : 'Search'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </form>
  )
}

function CustomerHeader({ profile }) {
  return (
    <div className="section header-section">
      <div className="mark" aria-hidden="true" />
      <div>
        <div className="customer-name">{profile.customer.name || profile.customer.email}</div>
        {profile.customer.name && <div className="customer-email muted">{profile.customer.email}</div>}
      </div>
    </div>
  )
}

function SetupSummary({ profile }) {
  if (profile.latestOrder) {
    return (
      <div className="section">
        <div className="eyebrow">Latest setup</div>
        <div className="card card-success">
          <span className="pill pill-success">Activated</span>
          <div className="card-title">Order #{profile.latestOrder.id.slice(-8)}</div>
          <div className="card-sub">{formatCents(profile.latestOrder.totalCents)}/mo</div>
        </div>
      </div>
    )
  }

  if (!profile.latestCart || profile.latestCart.items.length === 0) {
    return (
      <div className="section">
        <div className="eyebrow">Latest setup</div>
        <p className="muted">No setup saved yet.</p>
      </div>
    )
  }

  const { latestCart } = profile
  return (
    <div className="section">
      <div className="eyebrow">
        Latest setup{' '}
        <span className={`pill ${latestCart.status === 'converted' ? 'pill-success' : 'pill-muted'}`}>
          {latestCart.status}
        </span>
      </div>
      <div className="card">
        {latestCart.items.map((item) => {
          const product = latestCart.products[item.productId]
          return (
            <div key={item.id} className="line-item">
              <span>
                {item.quantity} × {product?.name ?? item.productId}
              </span>
              <span className="tabular">{formatCents(item.unitPriceCents * item.quantity)}</span>
            </div>
          )
        })}
        {latestCart.recommendationReason && <p className="reason muted">{latestCart.recommendationReason}</p>}
      </div>
    </div>
  )
}

function VoucherSection({ client, customerId, profile, products, onChanged }) {
  const cartProductIds = profile.latestCart?.items.map((i) => i.productId) ?? []
  const defaultProductId = cartProductIds[0] ?? products[0]?.id ?? ''
  const [selectedProductId, setSelectedProductId] = useState(defaultProductId)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  // Once activated, the voucher story is over -- no action needed.
  if (profile.latestOrder) return null

  const eyebrow = <div className="eyebrow">Voucher</div>

  if (profile.activeVoucher) {
    const mins = minutesUntil(profile.activeVoucher.expiresAt)
    return (
      <div className="section">
        {eyebrow}
        <div className="card">
          <span className="pill pill-success">Active</span>
          <div className="card-title mono">{profile.activeVoucher.code}</div>
          <div className="card-sub">
            {profile.activeVoucher.percentOff}% off · expires in {Math.max(mins, 0)}m
          </div>
        </div>
      </div>
    )
  }

  async function handleIssue() {
    if (!selectedProductId) return
    setBusy(true)
    setActionError(null)
    try {
      await api.issueVoucher(client, customerId, { productId: selectedProductId, percentOff: 20 })
      onChanged()
    } catch {
      setActionError("Couldn't send the voucher. Try again.")
    } finally {
      setBusy(false)
    }
  }

  async function handleResend() {
    if (!profile.latestVoucher) return
    setBusy(true)
    setActionError(null)
    try {
      await api.resendVoucher(client, profile.latestVoucher.id)
      onChanged()
    } catch {
      setActionError("Couldn't resend the voucher. Try again.")
    } finally {
      setBusy(false)
    }
  }

  // A voucher was issued before but isn't active anymore (expired,
  // unused) -- "checking back the next day" is a resend, not a fresh send.
  if (profile.latestVoucher && profile.latestVoucher.status !== 'redeemed') {
    return (
      <div className="section">
        {eyebrow}
        <div className="card">
          <span className="pill pill-muted">Expired, unused</span>
          <div className="card-title mono">{profile.latestVoucher.code}</div>
          <div className="card-sub">{profile.latestVoucher.percentOff}% off</div>
        </div>
        {actionError && <p className="error-text">{actionError}</p>}
        <button type="button" className="btn btn-primary" disabled={busy} onClick={handleResend}>
          {busy ? 'Resending…' : 'Resend with extended expiry'}
        </button>
      </div>
    )
  }

  if (!defaultProductId) return null

  return (
    <div className="section">
      {eyebrow}
      <label className="field-label" htmlFor="voucher-product">
        Item to discount
      </label>
      <select
        id="voucher-product"
        className="select"
        value={selectedProductId}
        onChange={(e) => setSelectedProductId(e.target.value)}
      >
        {(products.length ? products : cartProductIds.map((id) => ({ id, name: id }))).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {actionError && <p className="error-text">{actionError}</p>}
      <button type="button" className="btn btn-primary" disabled={busy} onClick={handleIssue}>
        {busy ? 'Sending…' : 'Send 20% voucher'}
      </button>
    </div>
  )
}

function InsightSection({ client, customerId }) {
  const [insight, setInsight] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Reset whenever the displayed customer changes (search, ticket switch).
  useEffect(() => {
    setInsight(null)
    setError(null)
  }, [customerId])

  async function handleGetInsight() {
    setBusy(true)
    setError(null)
    try {
      const { insight: text } = await api.getInsight(client, customerId)
      setInsight(text)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 503
          ? "AI insights aren't configured for this install."
          : "Couldn't generate an insight right now."
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="section">
      <div className="eyebrow">AI insight</div>
      {insight ? (
        <p className="insight-text">{insight}</p>
      ) : (
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={handleGetInsight}>
          {busy ? 'Thinking…' : 'Get AI insight'}
        </button>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

function ActivityList({ profile }) {
  if (profile.recentEvents.length === 0) return null
  return (
    <div className="section">
      <div className="eyebrow">Recent activity</div>
      <ul className="activity-list">
        {profile.recentEvents.slice(0, 8).map((event) => (
          <li key={event.id}>
            <span className="activity-detail">{event.detail}</span>
            <span className="activity-time muted">{timeAgo(event.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TicketSideBar
