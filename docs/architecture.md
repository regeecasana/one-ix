# Architecture

## Goal

A self-contained demo for a telco (XLSmart), following one customer --
**Ravta** -- through a single live loop: she builds a connectivity setup,
every meaningful thing she does is logged to a Zendesk ticket in real
time, and an agent reading that ticket recognizes an abandoned setup and
recovers it with a time-limited voucher, sent from a custom **ticket
sidebar app**.

Everything is real except money movement: activation produces a genuine
order record, but no payment processor is involved. See
[user-stories.md](user-stories.md) for the full script.

## Components

```
┌─────────────────────────────────┐        ┌────────────────────┐
│              apps/web             │  REST  │    zendesk-app       │
│  Next.js -- storefront (App        │◄──────►│ (ZAF sidebar, React) │
│  Router) + api (Route Handlers)      │        │ shown inside the      │
│  in one deploy. All storage is       │        │  Zendesk ticket view   │
│  Bird (Contacts API + Custom           │        └────────────────────┘
│  Objects) -- see "Storage: Bird CDP"     │                 ▲
│  below.                                    │                 │
└───────────────┬─────────────────┘                 │
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

- **One app, one deploy, storage in Bird.** The storefront and its API used
  to be two separate services (Express + Vite) on two hosts, needing CORS
  and two sets of env vars. Folding them into one Next.js app removes both
  -- same origin, one Vercel project. Storage moved from MongoDB/Prisma to
  Bird (app.bird.com) so customer data lives in a real CDP instead of an
  app-owned database -- see "Storage: Bird CDP" below.
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
| storage | Bird (app.bird.com) CDP -- Contacts API + Custom Objects | customer identity/events live in a real CDP instead of an app-owned database; see "Storage: Bird CDP" below |
| email | Nodemailer + Ethereal (auto-provisioned test SMTP, preview URL logged to console) behind an `EmailProvider` interface | lets the demo "receive" real-looking email with zero account setup and zero hosting cost; swappable for Resend/SendGrid by implementing the same interface |
| zendesk-app | Zendesk Apps Framework (ZAF) v2 + React, built/served via Zendesk Apps Tools (ZAT) | standard way to ship a ticket sidebar app; Zendesk hosts the built assets itself once uploaded, so this layer needs no hosting of its own |
| Zendesk API access | Zendesk REST API via API token (email/token auth), called only from `apps/web`'s server side | keeps the Zendesk credential server-side; the sidebar app never talks to Zendesk's admin API directly, only to `apps/web`'s internal API |

Visual design follows the brief's own mockups closely: a purple-to-pink
gradient system, rounded/pill UI (Plus Jakarta Sans).

## Storage: Bird CDP

This app used to store everything in MongoDB via Prisma. That's gone --
Bird (app.bird.com) is now the only datastore, in two parts:

- **Contacts API** (`apps/web/src/lib/bird/client.ts`) -- `Customer` and
  `InteractionEvent` map onto Bird Contacts and their event stream. A
  Bird contact's own `id` is the canonical `customerId` used everywhere
  else in the app (there's no separate app-generated id to bridge to).
- **Custom Objects** (`apps/web/src/lib/bird/objects.ts`) -- everything
  else (`Product`, `Cart`, `Order`, `Voucher`, `SupportTicket`) is a Bird
  Custom Object, created via the dashboard's Schema Explorer, not
  something app code can bootstrap. `CartItem`/`OrderItem` are embedded
  as a JSON array attribute on their parent object rather than a separate
  object -- Bird's Custom Object search API doesn't support joins, and
  array-valued attributes are supported.

**One-time setup required before this app can run for real:** create the
Custom Object types `products`, `carts`, `orders`, `vouchers`,
`support_tickets`, `activity_tickets` in the Bird dashboard, and add a
custom Contact attribute `activeTicketId`. Field lists and declared
unique keys are in [data-model.md](data-model.md). `activity_tickets` is
not one of the entities the previous MongoDB schema had -- it exists
solely to bridge a Zendesk ticket id back to a Bird contact id, because
the Contacts API only supports lookup by a declared identifier
(email/externalId), not by an arbitrary attribute like `activeTicketId`,
while Custom Objects do support attribute search.

**Known trade-off -- no cross-record transactions.** Two flows used to run
inside a `prisma.$transaction`: checkout (create order, decrement stock,
convert cart, redeem voucher) and voucher issuance (expire old active
vouchers, then create the new one). Bird's Custom Objects API has no
confirmed atomic increment or multi-record transaction, so both are now a
best-effort **saga** -- sequential writes, with checkout attempting to
compensate (re-increment already-decremented stock) if a later step
fails. This leaves a small, accepted race/partial-failure window that
didn't exist before, appropriate for this app's demo traffic level but
worth knowing about (`orderService.ts`, `voucherService.ts`).

**API basics confirmed empirically (2026-09) against a live workspace --
public docs were unreliable/contradictory for this:**
- Host is `https://api.bird.com` for both Contacts and Custom Objects --
  **not** `{region}.platform.bird.com`, which is a different, unrelated
  Bird API surface that happens to also exist and also returns
  plausible-looking errors.
- Auth header is `Authorization: AccessKey <key>` -- **not** `Bearer`.
  Confirmed by testing against real endpoints: a wrong path/id gives a
  generic `401 Unauthorized`, while a request that authenticates but lacks
  permission for that specific action gives a distinct `403
  FORBIDDEN_INTERNAL` -- that difference is what confirmed the scheme was
  right before the URL shape was fully nailed down.
- Data-storage **region (EU/US)**, set once per workspace at creation, is
  a data-residency setting, not part of the API host -- don't confuse it
  with routing.
- The dashboard calls this credential type an **"Access key"** (Team →
  Access keys, attached to named policies), not "API key" as most public
  Bird docs call it -- same feature, different label in the actual product.
- A Custom Object record's custom fields live nested under a `body` key,
  not flat at the top level (e.g. a field named `name` is really
  `body.name`); `id`, `createdAt`, `updatedAt`, `indexedAt` are
  system-provided on every record and aren't set by app code.
  `bird/objects.ts`'s `toBody`/`fromRecord` handle this mapping.
- Per-attribute **uniqueness isn't a property of the attribute** -- it's
  declared on the object's separate **Identifiers** tab in the dashboard
  (`orders.cartId`, `vouchers.code`, `activity_tickets.ticketId` all need
  to be added there, not just created as a plain attribute).

**Still unverified:** the exact `search` endpoint's request/response shape
(`ObjectFilter` in `bird/objects.ts`) and Contacts' own wire shape
(whether it also nests under `body`, or uses a distinct `identifiers`
array as originally assumed) -- confirm these the same way the above was
confirmed (real requests against the live workspace, reading the actual
error/response bodies) before trusting `bird/client.ts` or the `search`
path in `bird/objects.ts`.

See [data-model.md](data-model.md) for entities, [api-spec.md](api-spec.md) for
endpoints, [zendesk-app.md](zendesk-app.md) for the sidebar app design, and
[user-stories.md](user-stories.md) for the full set of flows the demo needs to
support.
