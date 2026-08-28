// apiBaseUrl and internalToken are ZAF "parameters" (see manifest.json),
// set once per install via Zendesk's app-installation UI -- never
// committed to source. The `client` here is the ZAFClient instance handed
// out by ClientProvider (see contexts/ClientProvider.jsx).

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function getSettings(client) {
  const metadata = await client.metadata()
  // eslint-disable-next-line no-console
  console.log('[sidebar] client.metadata() ->', metadata)
  const apiBaseUrl = String(metadata.settings?.apiBaseUrl ?? '').replace(/\/+$/, '')
  const internalToken = String(metadata.settings?.internalToken ?? '')
  if (!apiBaseUrl || !internalToken) {
    throw new Error(
      `apiBaseUrl / internalToken aren't configured for this app install. Got settings keys: [${Object.keys(metadata.settings ?? {}).join(', ')}]`
    )
  }
  return { apiBaseUrl, internalToken }
}

async function request(client, path, init) {
  const { apiBaseUrl, internalToken } = await getSettings(client)
  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': internalToken,
      ...init?.headers
    }
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? 'request_failed')
  }
  return body
}

export function getCustomerIdForTicket(client, ticketId) {
  return request(client, `/api/internal/tickets/${ticketId}/customer`)
}

export function getCustomerProfile(client, customerId) {
  return request(client, `/api/internal/customers/${customerId}/profile`)
}

export function getCustomerProfileByEmail(client, email) {
  const params = new URLSearchParams({ email })
  return request(client, `/api/internal/customers/by-email?${params}`)
}

export function getInsight(client, customerId) {
  return request(client, `/api/internal/customers/${customerId}/insights`, { method: 'POST' })
}

export function issueVoucher(client, customerId, params) {
  return request(client, `/api/internal/customers/${customerId}/vouchers`, {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

export function resendVoucher(client, voucherId, ttlMinutes) {
  return request(client, `/api/internal/vouchers/${voucherId}/resend`, {
    method: 'POST',
    body: JSON.stringify(ttlMinutes ? { ttlMinutes } : {})
  })
}

export function closeTicket(client, ticketId) {
  return request(client, `/api/internal/tickets/${ticketId}/close`, { method: 'POST' })
}

// Public, unauthenticated -- used only to populate the "issue a voucher
// for..." product picker when the customer has no cart yet to default to.
export function listProducts(client) {
  return request(client, '/api/products')
}
