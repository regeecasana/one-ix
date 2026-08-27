# Build Roadmap

Phased so there's a demoable slice at the end of each phase, not just at the
very end.

## Phase 0 — Scaffolding (this pass)

- Monorepo structure (`apps/*`, `packages/shared`), docs. No business logic
  yet.

## Phase 1 — Storefront happy path

- `api`: **done** — products, carts, cart items, checkout (mock payment,
  real `Order` rows).
- `storefront`: still a scaffold — catalog, product detail, cart, checkout
  UI not yet built.
- Demoable once storefront exists: browse → add to cart → check out → order
  confirmation email.

## Phase 2 — Abandonment detection + Zendesk ticket

- `api`: **done** — `checkout/start`, `AbandonedCartEvent`, the sweep job,
  Zendesk ticket creation (no-ops with a logged warning if Zendesk isn't
  configured), demo force-sweep endpoint.
- Demoable today via the API directly: abandon a cart → ticket appears in
  Zendesk with cart details (once `ZENDESK_*` env vars are set).

## Phase 3 — Coupon issuance + sidebar app

- `api`: **done** — internal endpoints (`carts/:id/summary`,
  `carts/:id/coupons`), coupon expiry job, coupon validation at checkout
  (checked live against `expiresAt`, not just the status column).
- `zendesk-app`: still a scaffold — cart summary view, "Send 20% coupon"
  action, coupon-state display not yet built.
- `storefront`: still a scaffold — apply-coupon UX at checkout,
  cart-restore-from-link not yet built.
- Demoable once storefront + zendesk-app exist: the full primary flow end
  to end (see [user-stories.md](user-stories.md)).

## Phase 4 — Supporting scenarios + polish

- Coupon expiry-unused path, duplicate-abandonment path, multi-item cart
  handling, ticket comments on coupon issuance/redemption.
- Visual polish on both storefront and sidebar app.
- Seed data / demo script rehearsal.

## Phase 5 — Deploy to free hosting

- Neon project provisioned, `api` deployed to Render (via
  [../render.yaml](../render.yaml)), `storefront` deployed to Vercel,
  external scheduler wired up to `force-sweep`, Zendesk app uploaded as a
  private app against a Zendesk trial instance. See
  [hosting.md](hosting.md).

## Explicitly out of scope

- Real payment processing of any kind.
- Real user auth (accounts, passwords, sessions beyond a cart id + email).
- Production-grade job queue (BullMQ/etc.) — `node-cron` in-process is enough
  at demo scale.
- Multi-tenant Zendesk support — one Zendesk instance, one internal token.
