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
│  Objects) -- see "Storage: Bird"     │                 ▲
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
  Bird (app.bird.com) -- see "Storage: Bird" below.
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
| storage | Bird (app.bird.com) -- Contacts API + Custom Objects | see "Storage: Bird" below for what's actually CDP vs. general-purpose storage |
| email | Nodemailer + Ethereal (auto-provisioned test SMTP, preview URL logged to console) behind an `EmailProvider` interface | lets the demo "receive" real-looking email with zero account setup and zero hosting cost; swappable for Resend/SendGrid by implementing the same interface |
| zendesk-app | Zendesk Apps Framework (ZAF) v2 + React, built/served via Zendesk Apps Tools (ZAT) | standard way to ship a ticket sidebar app; Zendesk hosts the built assets itself once uploaded, so this layer needs no hosting of its own |
| Zendesk API access | Zendesk REST API via API token (email/token auth), called only from `apps/web`'s server side | keeps the Zendesk credential server-side; the sidebar app never talks to Zendesk's admin API directly, only to `apps/web`'s internal API |

Visual design follows the brief's own mockups closely: a purple-to-pink
gradient system, rounded/pill UI (Plus Jakarta Sans).

## Storage: Bird

This app used to store everything in MongoDB via Prisma. That's gone --
Bird (app.bird.com) is now the only datastore, in two parts:

- **Contacts API** (`apps/web/src/lib/bird/client.ts`) -- `Customer`
  maps onto a Bird Contact. This is the one part of Bird that's a real
  CDP (identity resolution). A Bird contact's own `id` is the canonical
  `customerId` used everywhere else in the app (there's no separate
  app-generated id to bridge to).
- **Custom Objects** (`apps/web/src/lib/bird/objects.ts`) -- everything
  else, *including* `InteractionEvent`, is a Bird Custom Object, created
  manually in the dashboard's Data Management -> Custom Objects screen,
  not something app code can bootstrap. This is a generic data-modeling
  feature, not CDP-specific -- see "Is this really a CDP?" below.
  `CartItem`/`OrderItem` are their OWN objects (`cartItems`/`orderItems`),
  not embedded on their parent -- Bird's Custom Object attribute types
  have no array/JSON option (confirmed against the live field-type
  picker: Text, Number, Toggle, Select, Date, Date and Time, URL, Email
  Address, Phone Number, Domain, Tags), so this ended up matching the
  original relational shape rather than the document-style embedding
  first attempted.

**One-time setup required before this app can run for real:** create the
Custom Object types `products`, `carts`, `cartItems`, `orders`,
`orderItems`, `vouchers`, `supportTickets`, `activityTickets`,
`interactionEvent` in the Bird dashboard (**names must be exact
camelCase** -- snake_case names silently mismatch what the dashboard
saves internally and cause server-side 500s on every write, confirmed
the hard way), and add a custom Contact attribute `activeTicketId`.
Field lists and declared unique keys are in [data-model.md](data-model.md).
`activityTickets` is not one of the entities the previous MongoDB schema
had -- it exists solely to bridge a Zendesk ticket id back to a Bird
contact id, because the Contacts API only supports lookup by a declared
identifier (email/externalId), not by an arbitrary attribute like
`activeTicketId` (see the empirical findings below for why even that
lookup needed a workaround).

**Is this really a CDP?** Only partly. A CDP proper unifies customer
identity and behavior -- that's the Contacts API piece. `Product`,
`Cart`, `Order`, `Voucher`, `SupportTicket`, and even `InteractionEvent`
aren't customer data at all; modeling them as Custom Objects is really
using Bird as a general-purpose data store, a separate capability from
the CDP part, even though it lives in the same dashboard and product.

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
  (`orders.cartId`, `vouchers.code`, `activityTickets.ticketId` all need
  to be added there, not just created as a plain attribute).
- Object type **internal names must be exact camelCase**
  (`cartItems`, not `cart_items`) -- a snake_case name the dashboard
  silently reformats causes every create/search against it to fail with
  a generic server-side `500`, which looks like a broken object type
  rather than a naming mismatch.
- Listing/searching a Custom Object's records is a plain
  `GET .../catalog/objects/{name}` (paginated via `nextPageToken`), not
  `POST .../search` -- that endpoint exists and returns `200`s, but no
  filter shape tried against it actually filters (see `bird/objects.ts`
  for what was tried); results are matched client-side instead.
  `limit` maxes at 100 (a higher value 422s).
- Contacts' wire shape: `POST /contacts` (create, requires a top-level
  `displayName`), identifiers use `emailaddress` not `email`, responses
  have `attributes` flat (not `body`-nested like Custom Objects) plus
  `featuredIdentifiers` and top-level `createdAt`/`updatedAt`. A second
  create for an existing identifier 409s; `PATCH
  /contacts/identifiers/emailaddress/{email}` updates it instead (but
  silently *creates* a new contact if the identifier doesn't exist yet --
  not a safe stand-in for a read). Identifier values go raw into these
  URLs -- Bird does not URL-decode path segments, so an
  `encodeURIComponent`'d `@` breaks the lookup.
- `GET /contacts/identifiers/{key}/{value}` (read-by-identifier) is a
  blanket `403` regardless of identifier type or the AccessKey's
  policies, confirmed with a key its own owner describes as
  full-access -- it doesn't appear to be exposed to API keys at all.
  `getContactByEmail` instead lists+paginates `GET /contacts` (the same
  plain-list pattern as Custom Objects) and matches client-side.

**Interaction events don't use Bird's dedicated event-tracking feature.**
That feature (a separate "Application" registered under Developer ->
Applications, with its own write-key credential and
`capture.{region}.nest.messagebird.com` host) turned out to be dead
infrastructure for this workspace: every request to its write endpoint
-- valid or garbage, right method or wrong, real path or nonsense --
returned an identical generic `200 OK` from a bare AWS load balancer
(`Server: awselb/2.0`), and nothing tracked this way ever appeared in
the contact's Events tab in the Bird dashboard, at any date range.
Digging into the actual minified SDK bundle revealed Bird's tracking is
built on genuine Segment Cloud infrastructure (`api.segment.io/v1/b`,
`{writeKey, batch, sentAt}` body) -- posting there directly does work and
does show up in the dashboard's Events tab -- but that's reverse-engineered
from undocumented internals, not something to depend on. Interaction
events are instead stored as a Custom Object (`interactionEvent`,
fields `contactId`/`type`/`detail`), the same reliable, documented
mechanism as everything else -- see `bird/client.ts`'s `trackEvent`/
`listEventsForContact` for the full story. They won't show up in Bird's
own Events timeline UI as a result -- only under Data Management ->
Custom Objects -- but the sidebar app reads them directly, which is what
actually matters for this app.

See [data-model.md](data-model.md) for entities, [api-spec.md](api-spec.md) for
endpoints, [zendesk-app.md](zendesk-app.md) for the sidebar app design, and
[user-stories.md](user-stories.md) for the full set of flows the demo needs to
support.
