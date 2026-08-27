# Build Roadmap

Phased so there's a demoable slice at the end of each phase, not just at the
very end. This roadmap was rewritten when the demo moved from a generic
e-commerce abandoned-cart story to the XLSmart/Ravta telco story — see
[user-stories.md](user-stories.md) for why.

## Phase 0 — Scaffolding

- Monorepo structure (`apps/*`, `packages/shared`), docs. Done.

## Phase 1 — Catalog + activation happy path

- `api`: products (connectivity plans/add-ons), carts ("setup"), cart
  items, checkout/complete ("activation" — mock payment, real `Order`
  rows).
- `storefront`: catalog, product detail, setup, activation UI.
- Demoable: browse plans → build a setup → activate → confirmation email.

## Phase 2 — Connectivity Builder + identity resolution

- `api`: `POST /api/builder/recommend` (rules-based recommendation),
  `POST /api/carts/:id/otp/request` + `.../otp/verify` (mock OTP,
  find-or-create `Customer` by mobile/email, +5,000 points).
- `storefront`: the Connectivity Builder quiz, mobile/OTP capture UI,
  "save my setup" flow, campaign-attribution capture from landing-page
  query params.
- Demoable: land from a campaign link → answer the builder → get a
  recommended plan with a reason → save setup with mobile+OTP → see points
  awarded.

## Phase 3 — CDP nudge

- `api`: the CDP sweep job (saved, no purchase, high intent → email nudge,
  `remindedAt` set, no ticket), demo force-sweep endpoint, the completion
  bonus on activation.
- `storefront`: `/setup/:cartId` — the landing target for the nudge email
  link, restoring the setup.
- Demoable: save a setup, don't activate, force-sweep → nudge email
  arrives → click through → activate → 10,000 points total.

## Phase 4 — Support contact + sidebar app

- `api`: `POST /api/support/tickets`, the Unified Profile endpoint, the
  points-grant endpoint, ticket→customer resolution.
- `zendesk-app`: Unified Profile view, "Grant goodwill points" action —
  still a scaffold, not yet built.
- `storefront`: a support-contact form.
- Demoable today via the API standing in for the sidebar app (submit a
  support ticket, then call the internal endpoints by hand); full
  end-to-end demo needs `zendesk-app` too.

## Phase 5 — Deploy to free hosting

- Neon project provisioned, `api` deployed to Render (via
  [../render.yaml](../render.yaml)), `storefront` deployed to Vercel,
  external scheduler wired up to `force-sweep`, Zendesk app uploaded as a
  private app against a Zendesk trial instance. See [hosting.md](hosting.md).

## Explicitly out of scope

- Real payment processing of any kind.
- Real SMS/OTP delivery — the code is logged server-side, not sent through
  a carrier gateway.
- Real user auth (accounts, passwords, sessions beyond a cart id + email).
- An AI-diagnosis step before human handoff — tickets go straight to a
  human agent in this build (see [user-stories.md](user-stories.md)).
- A real CDP product integration — the "CDP" is a sweep job inside `api`.
- Production-grade job queue (BullMQ/etc.) — `node-cron` in-process is enough
  at demo scale.
- Multi-tenant Zendesk support — one Zendesk instance, one internal token.
