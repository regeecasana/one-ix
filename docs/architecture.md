# Architecture

## Goal

A self-contained demo for a telco (XLSmart), following one customer --
**Ravta** -- through a single live loop: she builds a connectivity setup,
every meaningful thing she does is logged to a Zendesk ticket in real
time, and an agent reading that ticket recognizes an abandoned setup and
recovers it with a time-limited voucher, sent from a custom **ticket
sidebar app**.

Everything is real except money movement: activation produces a genuine
order record in the database, but no payment processor is involved. See
[user-stories.md](user-stories.md) for the full script.

## Components

```
┌─────────────────────────────────┐        ┌────────────────────┐
│              apps/web             │  REST  │    zendesk-app       │
│  Next.js -- storefront (App        │◄──────►│ (ZAF sidebar, React) │
│  Router) + api (Route Handlers)      │        │ shown inside the      │
│  in one deploy. Prisma → MongoDB       │        │  Zendesk ticket view   │
│  Atlas.                                  │        └────────────────────┘
└───────────────┬─────────────────┘                 ▲
                 │ Zendesk REST API                    │
                 │ (create ticket, add comment)         │
                 ▼                                       │
      ┌──────────────────────┐                          │
      │   Zendesk instance     │──────────────────────────┘
      │ (tickets, sidebar host) │  ticket loads app, app
      └──────────────────────┘  calls back into apps/web's /api/internal/*
```

- **apps/web** -- the whole application: the public site (landing page,
  Connectivity Builder, 30-second email-capture popup, setup/activation, a
  standalone support-contact form) *and* its API (Route Handlers under
  `src/app/api/`), sharing one Next.js process. Owns the data model,
  interaction logging (persist + mirror to Zendesk), voucher
  issuance/resend, outbound email, and all calls to the Zendesk REST API.
  Also exposes an **internal** API surface (`/api/internal/*`) consumed
  only by the Zendesk sidebar app.
- **zendesk-app** -- a Zendesk Apps Framework (ZAF) app that renders in the
  ticket sidebar. Resolves the ticket to a customer, shows their profile
  and interaction history, and lets the agent issue/resend a voucher or
  close the ticket. Stays a separate deployable regardless of what
  apps/web is built with -- Zendesk hosts ZAF apps itself.
- **packages/shared** -- TypeScript types/constants imported by both apps
  so the contract between them can't silently drift.

## Why this shape

- **One app, one database, one deploy.** The storefront and its API used
  to be two separate services (Express + Vite) on two hosts, needing CORS
  and two sets of env vars. Folding them into one Next.js app removes both
  -- same origin, one Vercel project, one `MONGODB_URI`.
- **The interaction log is the product, not a side feature.** Every
  `InteractionEvent` is both persisted locally (so the app has a source of
  truth independent of Zendesk) and mirrored to the customer's ticket as a
  comment (so an agent never has to leave Zendesk to understand a
  session). See [data-model.md](data-model.md).
- **No automated abandonment detection.** Recognizing "added to setup,
  then went quiet" from the comment trail and deciding to act is the
  agent's judgment call, which is the actual thing being demonstrated.
  There's no background job in this build at all.
- **Vouchers are always agent-issued.** A discount is never sent
  automatically, only by an explicit click from the sidebar app.
- **Session tokens, not accounts.** Identity is resolved by email alone --
  a deliberate simplification (no OTP/magic-link verification) for demo
  velocity. To keep that from becoming an open write-anything IDOR, the
  30-second popup's identify call issues an HMAC-signed session token
  bound to the resulting customerId; every subsequent interaction-logging
  call must echo it back. This doesn't verify email ownership (someone who
  knows a customer's email can still identify as them), but it does stop a
  third party who merely observes or guesses a customerId from posting
  fabricated events onto a ticket that isn't theirs. See
  [api-spec.md](api-spec.md).

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| storefront + api | Next.js (App Router client components + Route Handlers), TypeScript, Tailwind, Zustand | one framework, one deploy; Route Handlers replace Express routes 1:1 with no separate server process |
| database | MongoDB, hosted on **Atlas** | one connection string for local dev and hosted; Prisma's Mongo connector keeps the same query API used everywhere else in the codebase (see [hosting.md](hosting.md)) |
| email | Nodemailer + Ethereal (auto-provisioned test SMTP, preview URL logged to console) behind an `EmailProvider` interface | lets the demo "receive" real-looking email with zero account setup and zero hosting cost; swappable for Resend/SendGrid by implementing the same interface |
| zendesk-app | Zendesk Apps Framework (ZAF) v2 + React, built/served via Zendesk Apps Tools (ZAT) | standard way to ship a ticket sidebar app; Zendesk hosts the built assets itself once uploaded, so this layer needs no hosting of its own |
| Zendesk API access | Zendesk REST API via API token (email/token auth), called only from `apps/web`'s server side | keeps the Zendesk credential server-side; the sidebar app never talks to Zendesk's admin API directly, only to `apps/web`'s internal API |

Visual design follows the brief's own mockups closely: a purple-to-pink
gradient system, rounded/pill UI (Plus Jakarta Sans).

See [data-model.md](data-model.md) for entities, [api-spec.md](api-spec.md) for
endpoints, [zendesk-app.md](zendesk-app.md) for the sidebar app design, and
[user-stories.md](user-stories.md) for the full set of flows the demo needs to
support.
