# Running the Demo

This covers **local dev**. To run the hosted version (Vercel + Render +
Neon, all free tier), see [hosting.md](hosting.md) -- the env vars are the
same either way.

There are two ways to run `api` and `storefront` locally:

- **Docker** ([infra/](../infra/)) -- `docker compose up --build`, no local
  Node/Postgres install needed. Recommended if you just want it running.
- **Directly with npm + a Neon project** -- described below. Better if
  you're actively developing and want the fastest edit/reload loop.

Either way, `apps/zendesk-app` is developed the same way (via `zat server`
against a real Zendesk trial instance) -- it isn't part of the Docker setup.

## Prerequisites

- Node.js 20+
- A free [Neon](https://neon.tech) Postgres project (not needed if you're
  using the Docker path, which runs Postgres in a container).
- A Zendesk trial/sandbox account with an API token and the Zendesk Apps
  Tools CLI: `npm install -g @zendesk/zendesk-apps-tools`.

## One-time setup

```
npm install
cp apps/api/.env.example apps/api/.env
cp apps/storefront/.env.example apps/storefront/.env
npm run prisma:migrate --workspace=apps/api
npm run seed --workspace=apps/api
```

Fill in `apps/api/.env`:

| var | purpose |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `ZENDESK_SUBDOMAIN` / `ZENDESK_EMAIL` / `ZENDESK_API_TOKEN` | Zendesk API auth |
| `INTERNAL_API_TOKEN` | shared secret the Zendesk app sends as `X-Internal-Token` |
| `STOREFRONT_URL` | used to build links in emails |
| `VOUCHER_TTL_MINUTES` | default `30`, matches the story |

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
docker compose up --build  # api on :4000, storefront on :5173, postgres on :5433
```

## Wiring up the Zendesk side

1. Enable **local apps** in the Zendesk trial account's Admin Center.
2. `cd apps/zendesk-app && npm run build && zat server`
3. Open any ticket in the Zendesk agent workspace; the sidebar app loads
   from the local server. Configure `apiBaseUrl` / `internalToken` in the
   app's local settings.

## Telling the story live, fast

1. The email popup fires 30 seconds after page load -- real, not
   configurable down further, since watching it appear is part of the
   demo beat. Don't rush past it.
2. Build a setup, submit the popup, watch the ticket populate with
   interaction comments in Zendesk as you click around.
3. Add a plan, then navigate away without activating -- from the sidebar
   app, issue a 20%-off voucher for that plan (30-minute expiry by
   default).
4. Follow the voucher link back, watch it auto-apply at checkout, activate.
5. To demo the "checked back the next day" beat without waiting a day:
   issue a voucher, let it sit, then click **"Resend with extended
   expiry"** in the sidebar app -- same simulated-time-compression idea as
   the earlier force-sweep endpoint, just as a manual agent action instead
   of a timer.

## Seed data

`apps/api` ships a seed script (`npm run seed --workspace=apps/api`) that
loads a small catalog of demo plans/add-ons named to match real XL
product conventions (e.g. `GoSurf799`).
