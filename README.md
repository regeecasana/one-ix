# oneix

A demo for a telco (XLSmart), following one customer — **Ravta** — through
a connectivity storefront wired directly into Zendesk. She lands on the
site, gets identified by email 30 seconds in (which opens a real Zendesk
ticket), and every meaningful action she takes from that point on -- viewing
a plan, saving a setup, activating, closing the tab -- lands as a live
comment on that ticket. An agent watching the ticket sees exactly where she
dropped off, checks whether she's eligible for a voucher on the item she
abandoned, and sends one from the ticket sidebar app. If she ignores it, the
voucher expires in 30-60 minutes and the agent can resend with an extended
window before giving up and closing the ticket.

```
Ravta:  visits the site → 30s in, enters her email → Zendesk ticket opens
system: every click, save, and activation is mirrored onto that ticket
        as a comment in real time
Ravta:  runs the Connectivity Builder → gets a recommended plan → "Save My
        Setup" → closes the tab without activating
agent:  sees the abandonment in the ticket, checks voucher eligibility for
        the item, sends a 20%-off voucher to her email (sidebar app)
Ravta:  ignores it for the voucher's lifespan → agent resends with a longer
        window the next day → she returns and activates, or the agent
        closes the ticket if she never does
```

Read [docs/user-stories.md](docs/user-stories.md) for the full narrative,
including the other scenarios the demo needs to cover.

## What's real, what's not

Everything is real except payment: activation writes an actual `Order`
record in the backend, vouchers are real time-limited codes validated
server-side, the Zendesk ticket is a real ticket in a real Zendesk
instance with real comments, and every email is a real email (sent to a
disposable Ethereal inbox by default). There's no AI-diagnosis step before
human handoff, and no background jobs -- the agent drives the voucher
lifecycle by hand, which is the point of the demo. See
[docs/architecture.md](docs/architecture.md) for exactly what's simulated.

## Structure

```
apps/
  storefront/    React + Vite storefront — landing/builder/setup/activation
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
| [docs/zendesk-app.md](docs/zendesk-app.md) | sidebar app design, ticket↔customer resolution, auth |
| [docs/email-templates.md](docs/email-templates.md) | the transactional emails the demo sends |
| [docs/demo-setup.md](docs/demo-setup.md) | how to run it locally end to end, including forcing the timing for a live demo |
| [docs/roadmap.md](docs/roadmap.md) | phased build plan, what's explicitly out of scope |

## Status

`apps/api` and `apps/storefront` are fully implemented and verified end to
end in a real browser: landing → 30s email identification (opens a Zendesk
ticket) → Connectivity Builder → recommended plan → save/activate, with
every interaction mirrored to the ticket as a comment, plus agent-issued
voucher redemption at checkout, as described in
[docs/user-stories.md](docs/user-stories.md). No accounts/signup — identity
is resolved by email only.
`apps/zendesk-app` is still a scaffold with no UI — see
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
