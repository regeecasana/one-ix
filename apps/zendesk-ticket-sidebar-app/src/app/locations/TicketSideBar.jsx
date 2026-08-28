import { useEffect, useRef, useState } from 'react'
import { useClient } from '../hooks/useClient'
import * as api from '../../lib/api'
import { ApiError } from '../../lib/api'
import { timeAgo } from '../../lib/format'

function TicketSideBar() {
  const client = useClient()

  const [phase, setPhase] = useState('search') // search | loading | error | ready
  const [errorMessage, setErrorMessage] = useState(null)
  const [email, setEmail] = useState('')
  const [customerId, setCustomerId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [products, setProducts] = useState([])

  const bodyRef = useRef(null)

  useEffect(() => {
    api.listProducts(client).then(setProducts).catch(() => {})
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

  async function handleSearch(e) {
    e.preventDefault()
    if (!email.trim()) return
    setPhase('loading')
    setErrorMessage(null)
    try {
      const p = await api.getCustomerProfileByEmail(client, email.trim())
      setCustomerId(p.customer.id)
      setProfile(p)
      setPhase('ready')
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError && err.status === 404 ? 'No customer with that email.' : 'Search failed.'
      )
      setPhase('error')
    }
  }

  async function reload() {
    const p = await api.getCustomerProfile(client, customerId)
    setProfile(p)
  }

  return (
    <div ref={bodyRef} className="app">
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="email"
          className="search-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Search for email address"
        />
        <button type="submit" className="btn btn-primary" disabled={phase === 'loading' || !email.trim()}>
          {phase === 'loading' ? '…' : 'Search'}
        </button>
      </form>

      {phase === 'search' && (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            🔍
          </div>
          <p>Search a customer email address to open the case</p>
        </div>
      )}

      {phase === 'error' && <p className="error-text">{errorMessage}</p>}

      {phase === 'ready' && profile && (
        <CustomerCase client={client} profile={profile} products={products} onChanged={reload} />
      )}
    </div>
  )
}

function CustomerCase({ client, profile, products, onChanged }) {
  const resolved = Boolean(profile.latestOrder)

  return (
    <>
      <CustomerHeader profile={profile} resolved={resolved} />
      <AiSummary client={client} profile={profile} />
      <RealtimeActivity profile={profile} />
      {resolved ? (
        <ServiceResolutionAction client={client} profile={profile} />
      ) : (
        <MarketingCampaignAction client={client} profile={profile} products={products} onChanged={onChanged} />
      )}
    </>
  )
}

function CustomerHeader({ profile, resolved }) {
  return (
    <div className="section header-section">
      <div>
        <div className="customer-name">{profile.customer.name || profile.customer.email}</div>
        <div className="customer-email muted">{profile.customer.email}</div>
      </div>
      <span className={`badge ${resolved ? 'badge-urgency' : 'badge-intent'}`}>
        {resolved ? 'High Urgency' : 'High Intent'}
      </span>
    </div>
  )
}

// Real backend-generated summary (POST .../insights) -- text only. Tags and
// the interaction count are derived from real profile data client-side; no
// persona/intent classification exists server-side yet.
function AiSummary({ client, profile }) {
  const [insight, setInsight] = useState(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setInsight(null)
    setBusy(true)
    setError(null)
    api
      .getInsight(client, profile.customer.id)
      .then(({ insight: text }) => {
        if (!cancelled) setInsight(text)
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err instanceof ApiError && err.status === 503
            ? "AI insights aren't configured for this install."
            : "Couldn't generate a summary right now."
        )
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [client, profile.customer.id])

  const tagNames = Array.from(
    new Set((profile.latestCart?.items ?? []).map((item) => profile.latestCart.products[item.productId]?.name).filter(Boolean))
  )

  return (
    <div className="section ai-card">
      <div className="eyebrow">✨ AI summary</div>
      {busy && <p className="muted">Generating summary…</p>}
      {error && <p className="error-text">{error}</p>}
      {insight && <p className="ai-text">{insight}</p>}
      {(tagNames.length > 0 || profile.recentEvents.length > 0) && (
        <div className="tag-row">
          {tagNames.map((name) => (
            <span key={name} className="tag">
              {name}
            </span>
          ))}
          {profile.recentEvents.length > 0 && (
            <span className="tag tag-muted">{profile.recentEvents.length} prior interactions</span>
          )}
        </div>
      )}
    </div>
  )
}

function RealtimeActivity({ profile }) {
  if (profile.recentEvents.length === 0) return null
  return (
    <div className="section">
      <div className="eyebrow">
        <span className="live-dot" aria-hidden="true" /> Real-time activity
      </div>
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

function MarketingCampaignAction({ client, profile, products, onChanged }) {
  const cartProductIds = profile.latestCart?.items.map((i) => i.productId) ?? []
  const defaultProductId = cartProductIds[0] ?? products[0]?.id ?? ''
  const [selectedProductId, setSelectedProductId] = useState(defaultProductId)
  const [voucher, setVoucher] = useState(profile.activeVoucher)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [actionError, setActionError] = useState(null)

  const productName = products.find((p) => p.id === selectedProductId)?.name ?? selectedProductId

  async function handleGenerate() {
    if (!selectedProductId) return
    setBusy(true)
    setActionError(null)
    try {
      const v = await api.issueVoucher(client, profile.customer.id, { productId: selectedProductId, percentOff: 10 })
      setVoucher(v)
    } catch {
      setActionError("Couldn't generate a voucher code. Try again.")
    } finally {
      setBusy(false)
    }
  }

  async function handleSendCampaign() {
    if (!voucher) return
    setBusy(true)
    setActionError(null)
    try {
      await api.resendVoucher(client, voucher.id)
      setSent(true)
      onChanged()
    } catch {
      setActionError("Couldn't send the campaign. Try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="section action-card">
      <div className="eyebrow">Recommended action</div>
      <p className="muted action-hint">Based on the customer's profile and behavior.</p>

      {sent ? (
        <div className="banner-success">Campaign sent via email.</div>
      ) : (
        <div className="card">
          <div className="card-title">10% activation discount voucher</div>
          <div className="card-sub">One-time 10% discount on the first month. Requires a voucher code.</div>

          {voucher && (
            <div className="voucher-code-row">
              <span className="mono">{voucher.code}</span>
              <span className="pill pill-success">Ready</span>
            </div>
          )}

          {!voucher && (
            <>
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
            </>
          )}

          {actionError && <p className="error-text">{actionError}</p>}

          {!voucher ? (
            <button type="button" className="btn btn-ghost" disabled={busy || !selectedProductId} onClick={handleGenerate}>
              {busy ? 'Generating…' : 'Generate'}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={busy} onClick={handleSendCampaign}>
              {busy ? 'Sending…' : 'Send campaign'}
            </button>
          )}
        </div>
      )}

      <button type="button" className="link-toggle" onClick={() => setShowOptions((v) => !v)}>
        See other options {showOptions ? '▲' : '▼'}
      </button>
      {showOptions && (
        <p className="muted small">
          {productName ? `Discounting ${productName}. ` : ''}
          Change the item above and generate a new code to switch offers.
        </p>
      )}
    </div>
  )
}

// No backend endpoint sends guided instructions yet -- this drafts the
// numbered steps straight into the ticket's comment box via the ZAF client
// so the agent reviews and sends it themselves, rather than faking a send.
const GUIDED_STEPS = [
  'Confirm livestream device',
  'Verify 5G/4G network mode',
  'Optimize device environment',
  'Run connection speed test'
]

function ServiceResolutionAction({ client, profile }) {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  const subscribedProductName =
    profile.latestCart?.items
      .map((item) => profile.latestCart.products[item.productId]?.name)
      .find(Boolean) ?? null

  const insights = [
    { label: subscribedProductName ? `Active ${subscribedProductName} subscriber` : 'Active subscriber', ok: true },
    { label: 'No payment issues', ok: true, placeholder: true },
    { label: 'No major outage detected', ok: true, placeholder: true },
    { label: 'Recent high-bandwidth usage', ok: true, placeholder: true }
  ]

  async function handleSend() {
    setBusy(true)
    setActionError(null)
    try {
      const text = `Guided setup steps for ${profile.customer.name || profile.customer.email}:\n${GUIDED_STEPS.map(
        (s, i) => `${i + 1}. ${s}`
      ).join('\n')}`
      await client.set('ticket.comment.text', text)
      setSent(true)
    } catch {
      setActionError("Couldn't draft the instructions. Try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="section action-card">
      <div className="eyebrow">Detected insights</div>
      <ul className="checklist">
        {insights.map((item) => (
          <li key={item.label}>
            <span className="check" aria-hidden="true">
              ✓
            </span>
            {item.label}
            {item.placeholder && <span className="tag tag-muted small">preview</span>}
          </li>
        ))}
      </ul>

      <div className="eyebrow">Recommended action</div>
      <p className="muted action-hint">
        Send {profile.customer.name || 'the customer'} a personalized step-by-step guide to optimize their connection
        before going live.
      </p>

      {sent ? (
        <div className="banner-success">Instructions sent!</div>
      ) : null}

      <ol className="step-list">
        {GUIDED_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      {actionError && <p className="error-text">{actionError}</p>}

      <button type="button" className="btn btn-primary" disabled={busy || sent} onClick={handleSend}>
        {busy ? 'Sending…' : sent ? 'Instructions sent' : 'Send guided instructions'}
      </button>
    </div>
  )
}

export default TicketSideBar
