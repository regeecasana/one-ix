# oneix

A demo platform built around one story: a shopper abandons their cart on an
e-commerce site, a support agent sees it show up as a Zendesk ticket, and
recovers the sale by issuing a coupon from a custom **ticket sidebar app** —
without ever leaving Zendesk.

```
consumer: add to cart → start checkout → abandon
system:   detects it → opens a Zendesk ticket
agent:    opens the ticket → sees the cart in the sidebar app → sends a
          20%-off coupon (expires in 15 minutes)
consumer: gets the coupon by email → returns → checks out at the discount
```

Read [docs/user-stories.md](docs/user-stories.md) for the full narrative,
including the other scenarios the demo needs to cover (happy-path checkout,
expired coupons, multi-item carts, and more).

## What's real, what's not

Everything is real except payment: checkout writes an actual `Order` record
in the backend, coupons are actually validated and expire on a real timer,
the Zendesk ticket is a real ticket in a real Zendesk instance, and the
recovery email is a real email (sent to a disposable Ethereal inbox by
default, so the demo doesn't need real email/payment infrastructure).

## Structure

```
apps/
  storefront/    React + Vite storefront — catalog, cart, checkout
  api/            Node/Express + Prisma backend — the single source of truth
  zendesk-app/    Zendesk ticket sidebar app (ZAF v2 + React)
packages/
  shared/         TypeScript types shared by all three apps
infra/            Docker Compose setup for running api + storefront locally
docs/             Architecture, data model, API spec, and demo runbook
```

## Tech stack

| Layer | Choice | Hosted (free tier) on |
|---|---|---|
| storefront | React + Vite + TypeScript, Tailwind, React Router, Zustand | **Vercel** |
| api | Node.js + Express + TypeScript, Prisma ORM | **Render** (Web Service) |
| database | PostgreSQL | **Neon** (serverless, scale-to-zero) — same DB for local dev and hosted, no SQLite-vs-Postgres drift |
| scheduling | `node-cron` in-process, coupon expiry also checked on-read | runs inside the Render service; see [docs/hosting.md](docs/hosting.md) for why on-read matters on a free host |
| email | Nodemailer + Ethereal (disposable inbox, preview URL logged to console) | Ethereal itself — no hosting needed |
| zendesk-app | Zendesk Apps Framework (ZAF) v2 + React | hosted **by Zendesk** once uploaded as a private app — no separate host |
| Zendesk ticketing | Zendesk REST API | Zendesk trial/sandbox instance |

Full rationale in [docs/architecture.md](docs/architecture.md); exact
deploy steps per service in [docs/hosting.md](docs/hosting.md). Nothing in
this stack requires a credit card.

Each app has its own README. The full design lives in `docs/`:

| doc | what's in it |
|---|---|
| [docs/architecture.md](docs/architecture.md) | system shape, component responsibilities, tech stack + why |
| [docs/hosting.md](docs/hosting.md) | which free service hosts which piece, and how to deploy each |
| [docs/user-stories.md](docs/user-stories.md) | the demo script — primary flow + supporting scenarios |
| [docs/data-model.md](docs/data-model.md) | entities, relationships, invariants |
| [docs/api-spec.md](docs/api-spec.md) | public + internal API surface, background jobs |
| [docs/zendesk-app.md](docs/zendesk-app.md) | sidebar app design, ticket↔cart resolution, auth |
| [docs/email-templates.md](docs/email-templates.md) | the two transactional emails the demo sends |
| [docs/demo-setup.md](docs/demo-setup.md) | how to run it locally end to end, including forcing the timing for a live demo |
| [docs/roadmap.md](docs/roadmap.md) | phased build plan, what's explicitly out of scope |

## Status

`apps/api` is fully implemented: products, carts, checkout, coupons, the
abandoned-cart sweep, coupon expiry, Zendesk ticket/comment calls, and
email are all working end to end (verified against both plain `npm run dev`
and the Docker stack in `infra/`). `apps/storefront` and `apps/zendesk-app`
are still scaffolds with no UI built yet — see
[docs/roadmap.md](docs/roadmap.md) for what's left.

## Quick start

With Docker (no local Node/Postgres install needed for `api`/`storefront`):

```
cp apps/api/.env.example apps/api/.env
cp apps/storefront/.env.example apps/storefront/.env
cd infra && docker compose up --build
```

Without Docker:

```
npm install
cp apps/api/.env.example apps/api/.env             # Neon connection string, Zendesk credentials, etc.
cp apps/storefront/.env.example apps/storefront/.env
npm run dev:api
npm run dev:storefront
npm run dev:zendesk-app
```

Full local setup (both paths) is in [docs/demo-setup.md](docs/demo-setup.md)
and [infra/README.md](infra/README.md); deploying the whole thing to Vercel +
Render + Neon for free — without Docker — is in
[docs/hosting.md](docs/hosting.md).
