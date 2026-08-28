# API Surface (apps/web)

Implemented as Next.js Route Handlers under `apps/web/src/app/api/`, same
origin as the storefront (no separate host, no CORS). Two audiences, two
trust levels:

- **Public API** (`/api/*`) -- called by the storefront. No account system;
  identity is resolved by email plus a session token (see below).
- **Internal API** (`/api/internal/*`) -- called only by the Zendesk
  sidebar app. Requires a shared secret header (`X-Internal-Token`)
  configured at install time. Never exposed to the storefront.

Money is always integer cents (actually whole Rupiah, see
[data-model.md](data-model.md)) on the wire.

## Public API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/products` | list the catalog |
| GET | `/api/products/:id` | product detail |
| POST | `/api/builder/recommend` | Connectivity Builder: body `{ usage: string[], devices, priority }` -> `{ productId, reason }`. A rules engine, not a model call |
| POST | `/api/carts` | create a setup. Body may include `{ utmSource, utmCampaign, utmContent }` |
| GET | `/api/carts/:id` | fetch setup contents (also the landing target for the voucher email link) |
| POST | `/api/carts/:id/items` | add/update a line item |
| DELETE | `/api/carts/:id/items/:itemId` | remove a line item |
| PATCH | `/api/carts/:id` | set `recommendationReason` |
| POST | `/api/identify` | body `{ email, name?, cartId?, bufferedEvents? }`. Find-or-create `Customer`, and if they don't already have an `activeTicketId`, create one and flush any buffered pre-identification events. Returns `{ customerId, sessionToken }` |
| POST | `/api/customers/:customerId/interactions` | body `{ type, detail, sessionToken }`. `sessionToken` must verify against `:customerId` (HMAC-signed at identify time, see below) or the request is rejected with 403 -- otherwise anyone who learns a customerId could post fabricated comments onto that customer's ticket. Logs one `InteractionEvent` and, if the customer has an `activeTicketId`, posts it as a comment. This is the endpoint behind every "customer did X" beat in [user-stories.md](user-stories.md) |
| GET | `/api/vouchers/:code?customerId=&productId=` | validate a voucher before submitting checkout. Rate-limited, requires both ids -- same reasoning as the old coupon-validation endpoint (a code alone isn't a secret worth exposing as an enumeration oracle) |
| POST | `/api/carts/:id/checkout/complete` | create the `Order` (mock payment), optionally applying `voucherCode`; marks cart `converted` |
| POST | `/api/support/tickets` | unchanged from the previous round -- a separate, standalone contact-support flow not yet reconciled with the per-customer activity ticket above |

### Session tokens

`sessionToken` is `HMAC-SHA256(customerId, SESSION_SECRET)`, issued once by
`/api/identify` and echoed back on every interaction call (verified with a
timing-safe comparison). It does **not** verify email ownership -- that's a
deliberate, already-documented tradeoff of skipping OTP/magic-link
verification for demo velocity (see [architecture.md](architecture.md)).
What it does close: a third party who merely observes or guesses a
customerId, without ever having called `/api/identify` themselves, can't
spam interaction events onto a ticket that isn't theirs.

## Internal API (Zendesk sidebar app)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/internal/tickets/:ticketId/customer` | resolve a ticket to a `customerId` (checks both `Customer.activeTicketId` and `SupportTicket.zendeskTicketId`) |
| GET | `/api/internal/customers/:customerId/profile` | customer info, latest cart + recommendation context, recent `InteractionEvent`s, active voucher (if any), most recent voucher regardless of status, order history -- what the sidebar app renders |
| GET | `/api/internal/customers/by-email?email=` | same profile shape, looked up by email instead of id -- powers the sidebar app's "find customer by email" search and its not-linked-ticket fallback |
| POST | `/api/internal/customers/:customerId/vouchers` | agent action: issue a voucher. Body `{ productId, percentOff?, ttlMinutes? }` (defaults 20 / 30). Emails the customer, posts a ticket comment |
| POST | `/api/internal/vouchers/:voucherId/resend` | agent action: extend the expiry and resend. Increments `resendCount`, re-emails, posts a comment -- this is "checking back the next day" |
| POST | `/api/internal/customers/:customerId/insights` | on-demand only: summarizes the customer's profile via OpenAI and returns `{ insight }`, a short actionable read for the agent. Rate-limited (10/min). Returns 503 `insights_not_configured` if `OPENAI_API_KEY` isn't set |
| POST | `/api/internal/tickets/:ticketId/close` | agent action: closes the ticket via the Zendesk API and clears `Customer.activeTicketId` so their next interaction opens a fresh one |

## Outbound: api -> Zendesk

`api` holds the only Zendesk credentials. Two kinds of calls:

1. **Create ticket** -- on first `/api/identify` for a customer with no
   `activeTicketId`. Subject like `Activity — {email}`.
2. **Add comment** -- on every `InteractionEvent`, and on every agent
   action (voucher issued, voucher resent, ticket closed). The ticket
   timeline is the entire point: an agent should be able to read it top to
   bottom and understand the whole session without opening the sidebar
   app.

Both no-op with a logged warning if `ZENDESK_*` isn't configured, same
pattern as before.

## Background jobs

None in this round. The previous CDP sweep is gone -- there's no automated
abandonment detection anymore; recognizing the pattern in the interaction
log and deciding to act is the agent's job, which is the point of the
demo. The one thing worth automating for pacing is the 30-second popup
delay, which is entirely client-side (see [demo-setup.md](demo-setup.md)).
