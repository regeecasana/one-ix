# API Surface (apps/api)

Two audiences, two trust levels:

- **Public API** (`/api/*`) — called by the storefront. No auth beyond an
  email captured at checkout; this is a demo, not a real account system.
- **Internal API** (`/api/internal/*`) — called only by the Zendesk sidebar
  app and by `api`'s own Zendesk-facing webhook receiver. Requires a shared
  secret header (`X-Internal-Token`) that the Zendesk app is configured with
  at install time. Never exposed to the storefront or the public internet
  without that header.

Money is always integer cents on the wire.

## Public API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/products` | list catalog |
| GET | `/api/products/:id` | product detail |
| POST | `/api/carts` | create a cart, returns `cartId` |
| GET | `/api/carts/:id` | fetch cart contents (also used to restore a cart from the coupon email link) |
| POST | `/api/carts/:id/items` | add/update an item (bumps `lastActivityAt`) |
| DELETE | `/api/carts/:id/items/:itemId` | remove an item |
| POST | `/api/carts/:id/checkout/start` | capture the customer email against the cart, bumps `lastActivityAt` — this is the "started checkout" signal the abandonment story hinges on |
| POST | `/api/carts/:id/checkout/complete` | create the `Order` (mock payment — always succeeds), optionally applying `couponCode`; marks cart `converted` |
| GET | `/api/coupons/:code?cartId=...` | validate a coupon code against a cart before submitting checkout (for inline "apply coupon" UX). `cartId` is required and rate-limited (20/min/IP) -- a coupon code alone is only ~48 bits of entropy, not a secret worth exposing as a bare enumeration oracle |

## Internal API (Zendesk sidebar app + Zendesk webhook receiver)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/internal/carts/:cartId/summary` | cart items, customer email, current `AbandonedCartEvent` status, any coupon and its state — what the sidebar app renders |
| POST | `/api/internal/carts/:cartId/coupons` | agent action: issue a coupon for this cart (`percentOff` defaults to 20, `ttlMinutes` defaults to 15). Records `issuedBy: agent`, sends the recovery email, appends a Zendesk ticket comment/tag via the Zendesk API |
| GET | `/api/internal/tickets/:ticketId/cart` | resolve a Zendesk ticket id to its `cartId` (the sidebar app only knows the ticket it's mounted in) |
| POST | `/api/internal/demo/force-sweep` | demo control: run the abandoned-cart sweep immediately instead of waiting for the interval |

## Outbound: api → Zendesk

`api` is the only component with Zendesk credentials (API token). It calls
Zendesk's REST API for two things:

1. **Create ticket** on abandonment detection — subject
   `Abandoned cart — {product name}`, requester = customer email, tag
   `abandoned_cart`, and a custom field / tag carrying `cart_id` so the
   sidebar app and `GET /api/internal/tickets/:ticketId/cart` can resolve it.
2. **Add a ticket comment** when a coupon is issued or redeemed, so the
   ticket timeline stays human-readable even without opening the sidebar app.

## Background jobs (in-process, `node-cron`)

| Job | Interval (default) | Behavior |
|---|---|---|
| Abandoned-cart sweep | every 1 min (demo), configurable via `ABANDON_SWEEP_INTERVAL_MS`; also triggerable via `POST /api/internal/demo/force-sweep` | finds `active` carts with `lastActivityAt` older than `ABANDON_THRESHOLD_MS` that have started checkout but not completed it; flips to `abandoned`, creates `AbandonedCartEvent`, creates the Zendesk ticket |
| Coupon expiry | every 1 min | flips `active` coupons past `expiresAt` to `expired` in the database; if the parent `AbandonedCartEvent` is still `coupon_sent`, flips it to `expired_unused` |

Coupon expiry is also **checked live** wherever it's read (checkout
validation, the internal cart-summary endpoint) by comparing `expiresAt` to
`now()`, not just trusted from the `status` column. That matters because
`api` runs on a free host that can go to sleep between requests (see
[hosting.md](hosting.md)) — correctness of "is this coupon still good" can't
depend on a timer having fired recently. The scheduled job that physically
flips the `status` column is for the ticket comment / audit trail, not the
source of truth. The abandoned-cart sweep doesn't have an on-read fallback
in the same way (nothing "reads" its way into noticing a cart went idle), so
on the hosted deployment it's driven by an external scheduler hitting
force-sweep — see [hosting.md](hosting.md).

See [demo-setup.md](demo-setup.md) for the env vars that make these fast
enough to watch live.
