# Architecture

## Goal

A self-contained demo that shows an **abandoned-cart recovery loop** end to end:
a shopper abandons a cart on a demo storefront, the system detects it and opens
a Zendesk ticket, a support agent uses a custom **ticket sidebar app** to issue
a time-limited coupon, and the shopper uses that coupon to complete the purchase.

Everything is real except money movement: checkout produces a genuine order
record in the backend, but no payment processor is involved.

## Components

```
┌──────────────────┐        ┌──────────────────────┐        ┌────────────────────┐
│   storefront      │  REST  │        api            │  REST  │   zendesk-app        │
│  (React/Vite)      │◄──────►│ (Node/Express+Prisma) │◄──────►│ (ZAF sidebar, React) │
│  browse/cart/       │        │  products, carts,     │        │ shown inside the      │
│  checkout            │        │  orders, coupons,      │        │  Zendesk ticket view   │
└──────────────────┘        │  abandoned-cart sweep, │        └────────────────────┘
                              │  email sending          │                 ▲
                              └──────────┬────────────┘                 │
                                         │ Zendesk REST API              │
                                         │ (create ticket, add comment)  │
                                         ▼                                │
                              ┌──────────────────────┐                  │
                              │   Zendesk instance     │──────────────────┘
                              │ (tickets, sidebar host) │  ticket loads app, app
                              └──────────────────────┘  calls back into `api`
```

- **storefront** — the public e-commerce site. Product catalog, cart, and a
  checkout that writes a real `Order` row but never touches a real payment
  gateway. Also the landing page for the "come back and use your coupon" email
  link.
- **api** — the single source of truth. Owns the data model, the abandoned-cart
  sweep job, coupon issuance/expiry, outbound email, and all calls to the
  Zendesk REST API (ticket creation, comments/tags). Also exposes an
  **internal** API surface consumed only by the Zendesk sidebar app.
- **zendesk-app** — a Zendesk Apps Framework (ZAF) app that renders in the
  ticket sidebar. Reads the cart id off the ticket, calls `api`'s internal
  endpoints to show cart contents and coupon eligibility, and lets the agent
  trigger coupon issuance with one click.
- **packages/shared** — TypeScript types/constants (Product, Cart, Order,
  Coupon shapes, API routes) imported by all three apps so the contract
  between them can't silently drift.

## Why this shape

- **One backend, one database.** The storefront and the Zendesk app are two
  different *views* onto the same cart/order/coupon data — they should never
  disagree about state, so there's exactly one service that owns writes.
- **Zendesk is a client of `api`, not the other way around.** The sweep job in
  `api` pushes ticket creation to Zendesk; the sidebar app pulls cart state
  from `api`. Zendesk never becomes a system of record for commerce data —
  it only stores a `cart_id` reference (as a ticket tag/custom field) plus
  human-readable context in the ticket body.
- **Everything time-based is configurable and demo-forceable.** Waiting a real
  "few minutes or hours" is unworkable in a live demo, so the abandonment
  threshold, sweep interval, and coupon TTL are all env-configurable, and
  `api` exposes a demo-only endpoint to force a sweep immediately. See
  [demo-setup.md](demo-setup.md).

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| storefront | React + Vite + TypeScript, Tailwind, React Router, Zustand | fast to scaffold, minimal ceremony for a demo cart/session store |
| api | Node.js + Express + TypeScript, Prisma ORM | Prisma schema doubles as living data-model documentation |
| database | PostgreSQL, hosted free on **Neon** | used for both local dev and the hosted demo — one connection string, no SQLite-vs-Postgres drift between environments (see [hosting.md](hosting.md)) |
| scheduling | `node-cron` in-process, with expiry also checked on-read (not just on a timer) | no external queue needed at demo scale; checking expiry on read means correctness doesn't depend on the process staying warm on a free host (see [hosting.md](hosting.md)) |
| email | Nodemailer + Ethereal (auto-provisioned test SMTP, preview URL logged to console) behind an `EmailProvider` interface | lets the demo "receive" real-looking email with zero account setup and zero hosting cost; swappable for Resend/SendGrid by implementing the same interface |
| zendesk-app | Zendesk Apps Framework (ZAF) v2 + React, built/served via Zendesk Apps Tools (ZAT) | standard way to ship a ticket sidebar app; Zendesk hosts the built assets itself once uploaded, so this layer needs no hosting of its own |
| Zendesk API access | Zendesk REST API via API token (email/token auth) from `api` only | keeps the Zendesk credential server-side; the sidebar app never talks to Zendesk's admin API directly, only to `api` |

All hosting is on free tiers — see [hosting.md](hosting.md) for exactly which
service hosts which piece, and the tradeoffs that come with "free."

See [data-model.md](data-model.md) for entities, [api-spec.md](api-spec.md) for
endpoints, [zendesk-app.md](zendesk-app.md) for the sidebar app design, and
[user-stories.md](user-stories.md) for the full set of flows the demo needs to
support.
