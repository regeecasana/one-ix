# Architecture

## Goal

A self-contained demo for a telco (XLSmart), following one customer --
**Ravta** -- through a single live loop: she builds a connectivity setup,
every meaningful thing she does is logged to a Zendesk ticket in real
time, and an agent reading that ticket recognizes an abandoned setup and
recovers it with a time-limited voucher, sent from a custom **ticket
sidebar app**.

Everything is real except money movement: activation produces a genuine
order record in the backend, but no payment processor is involved. See
[user-stories.md](user-stories.md) for the full script.

## Components

```
┌──────────────────┐        ┌──────────────────────┐        ┌────────────────────┐
│   storefront      │  REST  │        api            │  REST  │   zendesk-app        │
│  (React/Vite)      │◄──────►│ (Node/Express+Prisma) │◄──────►│ (ZAF sidebar, React) │
│  landing/builder/    │        │  products, carts,     │        │ shown inside the      │
│  setup/activation      │        │  interactions,          │        │  Zendesk ticket view   │
└──────────────────┘        │  vouchers, email          │        └────────────────────┘
                              └──────────┬────────────┘                 ▲
                                         │ Zendesk REST API              │
                                         │ (create ticket, add comment)  │
                                         ▼                                │
                              ┌──────────────────────┐                  │
                              │   Zendesk instance     │──────────────────┘
                              │ (tickets, sidebar host) │  ticket loads app, app
                              └──────────────────────┘  calls back into `api`
```

- **storefront** -- the public site: landing page, Connectivity Builder (3
  steps), a 30-second email-capture popup, setup/activation, and a
  standalone support-contact form. Fires an interaction event to `api` at
  every meaningful touchpoint.
- **api** -- the single source of truth. Owns the data model, interaction
  logging (persist + mirror to Zendesk), voucher issuance/resend,
  outbound email, and all calls to the Zendesk REST API. Also exposes an
  **internal** API surface consumed only by the Zendesk sidebar app.
- **zendesk-app** -- a Zendesk Apps Framework (ZAF) app that renders in the
  ticket sidebar. Resolves the ticket to a customer, shows their profile
  and interaction history, and lets the agent issue/resend a voucher or
  close the ticket.
- **packages/shared** -- TypeScript types/constants imported by all three
  apps so the contract between them can't silently drift.

## Why this shape

- **One backend, one database.** The storefront and the Zendesk app are two
  different *views* onto the same customer/interaction/voucher data --
  exactly one service owns writes.
- **The interaction log is the product, not a side feature.** Every
  `InteractionEvent` is both persisted locally (so `api` has a source of
  truth independent of Zendesk) and mirrored to the customer's ticket as a
  comment (so an agent never has to leave Zendesk to understand a
  session). See [data-model.md](data-model.md).
- **No automated abandonment detection.** The previous version of this
  demo had a background sweep job that auto-detected idle carts. This
  version deliberately removes it: recognizing "added to setup, then went
  quiet" from the comment trail and deciding to act is the agent's
  judgment call, which is the actual thing being demonstrated. There's no
  background job in this build at all.
- **Vouchers are always agent-issued.** Same invariant as the original
  coupon design: a discount is never sent automatically, only by an
  explicit click from the sidebar app.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| storefront | React + Vite + TypeScript, Tailwind, React Router, Zustand | fast to scaffold, minimal ceremony for a demo session store |
| api | Node.js + Express + TypeScript, Prisma ORM | Prisma schema doubles as living data-model documentation |
| database | PostgreSQL, hosted free on **Neon** | used for both local dev and the hosted demo -- one connection string, no SQLite-vs-Postgres drift between environments (see [hosting.md](hosting.md)) |
| email | Nodemailer + Ethereal (auto-provisioned test SMTP, preview URL logged to console) behind an `EmailProvider` interface | lets the demo "receive" real-looking email with zero account setup and zero hosting cost; swappable for Resend/SendGrid by implementing the same interface |
| zendesk-app | Zendesk Apps Framework (ZAF) v2 + React, built/served via Zendesk Apps Tools (ZAT) | standard way to ship a ticket sidebar app; Zendesk hosts the built assets itself once uploaded, so this layer needs no hosting of its own |
| Zendesk API access | Zendesk REST API via API token (email/token auth) from `api` only | keeps the Zendesk credential server-side; the sidebar app never talks to Zendesk's admin API directly, only to `api` |

Visual design this round follows the brief's own mockups closely: a
purple-to-pink gradient system, rounded/pill UI (Plus Jakarta Sans),
replacing the earlier signal-bars/mono design entirely rather than
layering on top of it.

All hosting is on free tiers -- see [hosting.md](hosting.md) for exactly which
service hosts which piece, and the tradeoffs that come with "free."

See [data-model.md](data-model.md) for entities, [api-spec.md](api-spec.md) for
endpoints, [zendesk-app.md](zendesk-app.md) for the sidebar app design, and
[user-stories.md](user-stories.md) for the full set of flows the demo needs to
support.
