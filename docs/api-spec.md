# API Surface (apps/api)

Two audiences, two trust levels:

- **Public API** (`/api/*`) -- called by the storefront. No auth beyond an
  email address; this is a demo, not a real account system.
- **Internal API** (`/api/internal/*`) -- called only by the Zendesk
  sidebar app. Requires a shared secret header (`X-Internal-Token`)
  configured at install time. Never exposed to the storefront.

Money is always integer cents on the wire.

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
| POST | `/api/identify` | body `{ email }`. Find-or-create `Customer`, and if they don't already have an `activeTicketId`, create one and flush any buffered pre-identification events. Returns `{ customerId }` |
| POST | `/api/customers/:customerId/interactions` | body `{ type, detail }`. Logs one `InteractionEvent` and, if the customer has an `activeTicketId`, posts it as a comment. This is the endpoint behind every "Ravta did X" beat in [user-stories.md](user-stories.md) |
| GET | `/api/vouchers/:code?customerId=&productId=` | validate a voucher before submitting checkout. Rate-limited, requires both ids -- same reasoning as the old coupon-validation endpoint (a code alone isn't a secret worth exposing as an enumeration oracle) |
| POST | `/api/carts/:id/checkout/complete` | create the `Order` (mock payment), optionally applying `voucherCode`; marks cart `converted` |
| POST | `/api/support/tickets` | unchanged from the previous round -- a separate, standalone contact-support flow not yet reconciled with the per-customer activity ticket above |

## Internal API (Zendesk sidebar app)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/internal/tickets/:ticketId/customer` | resolve a ticket to a `customerId` (checks both `Customer.activeTicketId` and `SupportTicket.zendeskTicketId`) |
| GET | `/api/internal/customers/:customerId/profile` | customer info, latest cart + recommendation context, recent `InteractionEvent`s, active voucher (if any), order history -- what the sidebar app renders |
| POST | `/api/internal/customers/:customerId/vouchers` | agent action: issue a voucher. Body `{ productId, percentOff?, ttlMinutes? }` (defaults 20 / 30). Emails the customer, posts a ticket comment |
| POST | `/api/internal/vouchers/:voucherId/resend` | agent action: extend the expiry and resend. Increments `resendCount`, re-emails, posts a comment -- this is "checking back the next day" |
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
