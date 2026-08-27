# oneix

A demo for a telco (XLSmart), following one customer — **Ravta** — through
two acts: she lands from a TikTok campaign, builds a personalized
connectivity setup, saves it without activating, and gets nudged back with
a points bonus once a simulated CDP notices high intent. Separately, she
emails support about a network issue, and the agent sees her full customer
profile immediately — no "what's your account number" — via a custom
**Zendesk ticket sidebar app**.

```
Act 1 — acquisition + CDP nudge
Ravta:  TikTok ad → Connectivity Builder → recommended plan → "save my
        setup" (mobile + OTP, +5,000 XL points) → doesn't activate
system: CDP sweep notices saved-but-not-activated, high intent
Ravta:  gets an email nudge → returns → activates (+5,000 more points)

Act 2 — proactive support contact (independent of Act 1)
Ravta:  emails support about a network issue
system: creates a Zendesk ticket carrying her Unified Profile
agent:  opens the ticket, already has full context, grants goodwill points
        from the sidebar app in one click
```

Read [docs/user-stories.md](docs/user-stories.md) for the full narrative,
including the other scenarios the demo needs to cover.

## What's real, what's not

Everything is real except payment, and the OTP is a demo prop: activation
writes an actual `Order` record in the backend, points are a real running
balance, the Zendesk ticket is a real ticket in a real Zendesk instance,
and every email is a real email (sent to a disposable Ethereal inbox by
default). The "OTP" is a code logged server-side rather than sent by real
SMS, and there's no AI-diagnosis step before human handoff — see
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
| scheduling | `node-cron` in-process (the CDP sweep) | runs inside the Render service; see [docs/hosting.md](docs/hosting.md) for how it stays alive on a free host |
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
end in a real browser: the full Act 1 (TikTok landing → Connectivity
Builder → save setup with OTP → CDP nudge email → activate, with points
awarded at each step) and Act 2 (support ticket → Unified Profile →
goodwill points grant) both work as described in
[docs/user-stories.md](docs/user-stories.md). No accounts/signup — identity
is resolved by mobile number/email, and the OTP is a demo prop.
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
