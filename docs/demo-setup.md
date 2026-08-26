# Running the Demo

This covers **local dev**. To run the hosted version (Vercel + Render +
Neon, all free tier), see [hosting.md](hosting.md) — the env vars are the
same either way.

There are two ways to run `api` and `storefront` locally:

- **Docker** ([infra/](../infra/)) — `docker compose up --build`, no local
  Node/Postgres install needed. Recommended if you just want it running.
- **Directly with npm + a Neon project** — described below. Better if you're
  actively developing and want the fastest edit/reload loop, or want your
  local run to hit the same database as everyone else on the team.

Either way, `apps/zendesk-app` is developed the same way (via `zat server`
against a real Zendesk trial instance) — it isn't part of the Docker setup.

## Prerequisites

- Node.js 20+
- A free [Neon](https://neon.tech) Postgres project (used locally too, not
  just when hosted — see [hosting.md](hosting.md) for why). Not needed if
  you're using the Docker path instead, which runs Postgres in a container.
- A Zendesk trial/sandbox account (free trials work fine) with:
  - An API token (Admin Center → Apps and integrations → APIs → Zendesk API)
  - Zendesk Apps Tools installed for building/serving the sidebar app:
    `npm install -g @zendesk/zendesk-apps-tools`

## One-time setup

```
npm install                     # installs all workspaces
cp apps/api/.env.example apps/api/.env
cp apps/storefront/.env.example apps/storefront/.env
npm run prisma:migrate --workspace=apps/api
```

Fill in `apps/api/.env`:

| var | purpose |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `ZENDESK_SUBDOMAIN` | your trial subdomain |
| `ZENDESK_EMAIL` / `ZENDESK_API_TOKEN` | Zendesk API auth |
| `INTERNAL_API_TOKEN` | shared secret the Zendesk app sends as `X-Internal-Token` |
| `STOREFRONT_URL` | used to build links in emails |
| `ABANDON_THRESHOLD_MS` | how idle a checkout-started cart must be to count as abandoned — default a real value, but set low (e.g. `60000`) for a live demo |
| `ABANDON_SWEEP_INTERVAL_MS` | how often the sweep job runs — keep low (e.g. `15000`) for a live demo |
| `COUPON_TTL_MINUTES` | default `15`, matches the story |

## Running everything

Without Docker:

```
npm run dev:api            # http://localhost:4000
npm run dev:storefront     # http://localhost:5173
npm run dev:zendesk-app    # zat server, see below
```

With Docker, instead of the first two (see [infra/README.md](../infra/README.md)):

```
cd infra
docker compose up --build  # api on :4000, storefront on :5173, postgres on :5432
```

## Wiring up the Zendesk side

1. In the Zendesk trial account, enable **local apps** (Admin Center →
   Apps and integrations → Actions → local testing / "Enable local apps" —
   naming varies by Zendesk version).
2. `cd apps/zendesk-app && npm run build && zat server`
3. Open any ticket in the Zendesk agent workspace; the sidebar app loads from
   the local server. Configure `apiBaseUrl` / `internalToken` in the app's
   local settings to point at your running `api` instance.

## Telling the story live, fast

Waiting on real abandonment timing is not demo-friendly, so:

1. Set `ABANDON_THRESHOLD_MS` low (e.g. one minute) before the demo.
2. Or skip the wait entirely: `POST /api/internal/demo/force-sweep` runs the
   sweep immediately for any cart that has started (but not completed)
   checkout, regardless of how long it's been idle.
3. Suggested run order: add to cart on the storefront → start checkout → close
   the tab → hit the force-sweep endpoint (or wait out the short threshold) →
   switch to Zendesk, show the new ticket → open the sidebar app → click
   "Send 20% coupon" → switch back to the storefront, follow the emailed
   link (via the Ethereal preview URL logged by `api`) → complete checkout at
   the discounted price.

## Seed data

`apps/api` ships a seed script (`npm run seed --workspace=apps/api`) that
loads a handful of demo products so the storefront isn't empty on first run.
