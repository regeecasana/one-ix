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

async function getApiBaseUrl(client) {
  const metadata = await client.metadata()
  const apiBaseUrl = String(metadata.settings?.apiBaseUrl ?? '').replace(/\/+$/, '')
  if (!apiBaseUrl) {
    throw new Error("apiBaseUrl isn't configured for this app install.")
  }
  return apiBaseUrl
}

// internalToken is a `secure: true` manifest parameter -- Zendesk never
// hands those to the app's own client-side JS (client.metadata().settings
// simply omits the key entirely, confirmed live: settings only ever
// contained { name, apiBaseUrl, title }). The only way to use a secure
// parameter is client.request()'s {{setting.<name>}} template syntax,
// which Zendesk's own request-proxying layer substitutes server-side
// before the request leaves their infrastructure -- so this has to go
// through client.request(), not fetch().
async function request(client, path, init = {}) {
  const apiBaseUrl = await getApiBaseUrl(client)
  try {
    return await client.request({
      url: `${apiBaseUrl}${path}`,
      type: init.method ?? 'GET',
      ...(init.body ? { contentType: 'application/json', data: init.body } : {}),
      headers: {
        'X-Internal-Token': '{{setting.internalToken}}',
        ...init.headers
      },
      secure: true,
      cors: true
    })
  } catch (err) {
    // ZAF rejects non-2xx responses with a jqXHR-like object -- {status,
    // statusText, responseText} -- rather than throwing a JS Error.
    const status = err?.status
    let body = null
    try {
      body = JSON.parse(err?.responseText ?? '')
    } catch {
      // not JSON -- leave body null
    }
    if (status) {
      throw new ApiError(status, body?.error ?? err?.statusText ?? 'request_failed')
    }
    throw err instanceof Error ? err : new Error(String(err?.responseText || err))
  }
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
