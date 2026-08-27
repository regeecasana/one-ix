# Architecture

## Goal

A self-contained demo for a telco (XLSmart), following one customer —
**Ravta** — through two independent acts:

1. **Acquisition + CDP nudge.** She lands from a TikTok campaign, builds a
   personalized connectivity setup, saves it without activating, and gets
   nudged back with an XL-Points bonus once a simulated CDP detects high
   intent and no purchase.
2. **Proactive support contact.** Separately, she emails support about a
   network issue. The ticket carries her full Unified Profile, so the agent
   never has to ask who she is — and can grant goodwill points in one click.

Everything is real except money movement and the OTP/SMS: activation
produces a genuine order record in the backend, but no payment processor is
involved, and the "OTP" is a demo-only code logged to the console rather
than sent by real SMS. See [user-stories.md](user-stories.md) for the full
script and [hosting.md](hosting.md) note on what's simulated vs. real.

## Components

```
┌──────────────────┐        ┌──────────────────────┐        ┌────────────────────┐
│   storefront      │  REST  │        api            │  REST  │   zendesk-app        │
│  (React/Vite)      │◄──────►│ (Node/Express+Prisma) │◄──────►│ (ZAF sidebar, React) │
│  landing/builder/    │        │  products, carts,     │        │ shown inside the      │
│  setup/activation      │        │  CDP sweep, support   │        │  Zendesk ticket view   │
└──────────────────┘        │  tickets, email          │        └────────────────────┘
                              └──────────┬────────────┘                 ▲
                                         │ Zendesk REST API              │
                                         │ (create ticket, add comment)  │
                                         ▼                                │
                              ┌──────────────────────┐                  │
                              │   Zendesk instance     │──────────────────┘
                              │ (tickets, sidebar host) │  ticket loads app, app
                              └──────────────────────┘  calls back into `api`
```

- **storefront** — the public site: landing page, Connectivity Builder,
  OTP/save-setup, activation (writes a real `Order` row, no real payment
  gateway), and a support-contact form. Also the landing page for the
  "continue my setup" email link.
- **api** — the single source of truth. Owns the data model, the CDP sweep
  job, points, outbound email, and the one call to the Zendesk REST API
  (ticket creation on inbound support contact, plus comments). Also exposes
  an **internal** API surface consumed only by the Zendesk sidebar app.
- **zendesk-app** — a Zendesk Apps Framework (ZAF) app that renders in the
  ticket sidebar. Resolves the ticket to a customer, calls `api`'s internal
  endpoints to show the Unified Profile, and lets the agent grant goodwill
  points with one click.
- **packages/shared** — TypeScript types/constants (Product, Cart, Order
  shapes, API routes) imported by all three apps so the contract between
  them can't silently drift.

## Why this shape

- **One backend, one database.** The storefront and the Zendesk app are two
  different *views* onto the same customer/cart/order data — they should
  never disagree about state, so there's exactly one service that owns
  writes.
- **Zendesk only enters the picture on inbound contact.** Unlike the
  earlier version of this demo, the CDP sweep never talks to Zendesk at all
  — it's a pure email nudge. A ticket only exists because Ravta emailed
  support herself; `api` enriches it with her Unified Profile context
  rather than Zendesk ever becoming a system of record for that data.
- **Everything time-based is configurable and demo-forceable.** Waiting a real
  "an hour later" is unworkable in a live demo, so the CDP threshold and
  sweep interval are env-configurable, and `api` exposes a demo-only
  endpoint to force a sweep immediately. See [demo-setup.md](demo-setup.md).
- **The OTP is a demo prop, not a real SMS integration.** A code is
  generated and logged server-side (same pattern as the Ethereal email
  preview link) rather than sent through a real carrier gateway — this is
  a demo of the *flow*, not a working telco backend.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| storefront | React + Vite + TypeScript, Tailwind, React Router, Zustand | fast to scaffold, minimal ceremony for a demo session store |
| api | Node.js + Express + TypeScript, Prisma ORM | Prisma schema doubles as living data-model documentation |
| database | PostgreSQL, hosted free on **Neon** | used for both local dev and the hosted demo — one connection string, no SQLite-vs-Postgres drift between environments (see [hosting.md](hosting.md)) |
| scheduling | `node-cron` in-process | no external queue needed at demo scale |
| email | Nodemailer + Ethereal (auto-provisioned test SMTP, preview URL logged to console) behind an `EmailProvider` interface | lets the demo "receive" real-looking email with zero account setup and zero hosting cost; swappable for Resend/SendGrid by implementing the same interface |
| zendesk-app | Zendesk Apps Framework (ZAF) v2 + React, built/served via Zendesk Apps Tools (ZAT) | standard way to ship a ticket sidebar app; Zendesk hosts the built assets itself once uploaded, so this layer needs no hosting of its own |
| Zendesk API access | Zendesk REST API via API token (email/token auth) from `api` only | keeps the Zendesk credential server-side; the sidebar app never talks to Zendesk's admin API directly, only to `api` |

All hosting is on free tiers — see [hosting.md](hosting.md) for exactly which
service hosts which piece, and the tradeoffs that come with "free."

See [data-model.md](data-model.md) for entities, [api-spec.md](api-spec.md) for
endpoints, [zendesk-app.md](zendesk-app.md) for the sidebar app design, and
[user-stories.md](user-stories.md) for the full set of flows the demo needs to
support.
