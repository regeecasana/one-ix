# API Surface (apps/api)

Two audiences, two trust levels:

- **Public API** (`/api/*`) — called by the storefront. No auth beyond an
  email/mobile number captured during the flow; this is a demo, not a real
  account system.
- **Internal API** (`/api/internal/*`) — called only by the Zendesk sidebar
  app. Requires a shared secret header (`X-Internal-Token`) that the
  Zendesk app is configured with at install time. Never exposed to the
  storefront or the public internet without that header.

Money is always integer cents on the wire.

## Public API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/products` | list the catalog (connectivity plans + add-ons) |
| GET | `/api/products/:id` | product detail |
| POST | `/api/builder/recommend` | Connectivity Builder: body `{ usage, devices }` → `{ productId, reason }`. A deterministic rules engine, not a model call — see [architecture.md](architecture.md) |
| POST | `/api/carts` | create a setup. Body may include `{ utmSource, utmCampaign, utmContent }` captured from the landing page's query params |
| GET | `/api/carts/:id` | fetch setup contents (also used to restore a setup from the "Continue My Setup" email link) |
| POST | `/api/carts/:id/items` | add/update a line item (bumps `lastActivityAt`) |
| DELETE | `/api/carts/:id/items/:itemId` | remove a line item |
| POST | `/api/carts/:id/otp/request` | body `{ mobileNumber }`. Generates a 6-digit code, stores it on the cart, "sends" it -- logged to the server console (`[otp] mobile=... code=...`), no real SMS. Always succeeds |
| POST | `/api/carts/:id/otp/verify` | body `{ email, mobileNumber, otp, name? }`. Verifies the code, resolves identity (find-or-create `Customer` by mobile number or email), links the cart, awards **+5,000 points** — this is "save my setup" |
| POST | `/api/carts/:id/checkout/complete` | create the `Order` (mock payment, always succeeds); marks cart `converted`. If `Cart.remindedAt` is set, awards a **+5,000 point completion bonus** on top of the order |
| POST | `/api/support/tickets` | body `{ email, subject, message }`. Resolves the customer by email (found-or-created), creates a Zendesk ticket carrying their Unified Profile as context, records a `SupportTicket` row. This is Ravta's proactive contact — see [user-stories.md](user-stories.md) Act 2 |

## Internal API (Zendesk sidebar app)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/internal/tickets/:ticketId/customer` | resolve a Zendesk ticket id to its `customerId` via `SupportTicket` |
| GET | `/api/internal/customers/:customerId/profile` | the **Unified Profile**: customer info, points balance, campaign attribution + recommended plan from their most recent cart, activation history, recent support tickets — what the sidebar app renders |
| POST | `/api/internal/customers/:customerId/points` | agent action: grant goodwill points. Body `{ amount, reason }`. Updates the balance, sends a notification email, and — if the request came from a ticket context — appends a Zendesk ticket comment |
| POST | `/api/internal/demo/force-sweep` | demo control: run the CDP sweep immediately instead of waiting for the interval |

## Outbound: api → Zendesk

`api` is the only component with Zendesk credentials (API token). Ticket
creation now happens on **inbound contact only** (`POST
/api/support/tickets`), not on any automated detection — the CDP sweep
never touches Zendesk. The ticket body includes enough of the Unified
Profile (campaign source, saved setup / recommended plan, points balance,
activation status) that the agent doesn't have to ask who Ravta is. A
follow-up comment is posted when an agent grants goodwill points from the
sidebar app, so the ticket timeline stays readable without opening the app.

## Background jobs (in-process, `node-cron`)

| Job | Interval (default) | Behavior |
|---|---|---|
| CDP sweep | every 1 min (demo), configurable via `ABANDON_SWEEP_INTERVAL_MS`; also triggerable via `POST /api/internal/demo/force-sweep` | finds `active` carts with a `customerId`, `remindedAt IS NULL`, and `lastActivityAt` older than `ABANDON_THRESHOLD_MS` — saved, no purchase, high intent. Sends the points-bonus nudge email and sets `remindedAt`. No Zendesk call. |

There's no expiry job anymore — points don't expire the way the old coupon
did, so there's nothing to sweep on that axis. The one thing worth keeping
in mind on a free host that can sleep between requests (see
[hosting.md](hosting.md)): the CDP sweep is timer-driven with no on-read
fallback, same caveat the old abandoned-cart sweep had — on the hosted
deployment it's driven by an external scheduler hitting `force-sweep`.

See [demo-setup.md](demo-setup.md) for the env vars that make this fast
enough to watch live.
