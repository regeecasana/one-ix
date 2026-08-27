# Running the Demo

This covers **local dev**. To run the hosted version (Vercel + MongoDB
Atlas), see [hosting.md](hosting.md) -- the env vars are the same either
way, since local dev and production point at the same Atlas cluster.

`apps/zendesk-app` is developed separately (via `zat server` against a real
Zendesk trial instance) -- it isn't part of `apps/web`'s dev server.

## Prerequisites

- Node.js 20+
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (M0 is
  fine -- it's still a replica set, which Prisma's Mongo connector needs
  for `$transaction`).
- A Zendesk trial/sandbox account with an API token and the Zendesk Apps
  Tools CLI: `npm install -g @zendesk/zendesk-apps-tools`.

## One-time setup

```
npm install
cp apps/web/.env.example apps/web/.env.local
cp apps/web/.env.example apps/web/.env        # Prisma CLI reads .env, not .env.local
npm run db:push --workspace=apps/web
npm run seed --workspace=apps/web
```

Fill in `apps/web/.env.local` (and `.env`, same values):

| var | purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string |
| `ZENDESK_SUBDOMAIN` / `ZENDESK_EMAIL` / `ZENDESK_API_TOKEN` | Zendesk API auth |
| `INTERNAL_API_TOKEN` | shared secret the Zendesk app sends as `X-Internal-Token` |
| `SESSION_SECRET` | signs per-customer session tokens -- set this so sessions survive a dev-server restart (see [api-spec.md](api-spec.md)) |
| `VOUCHER_TTL_MINUTES` | default `30`, matches the story |

## Running everything

```
npm run dev:web             # http://localhost:3000 -- storefront + api
npm run dev:zendesk-app     # zat server, see below
```

## Wiring up the Zendesk side

1. Enable **local apps** in the Zendesk trial account's Admin Center.
2. `cd apps/zendesk-app && npm run build && zat server`
3. Open any ticket in the Zendesk agent workspace; the sidebar app loads
   from the local server. Configure `apiBaseUrl` / `internalToken` in the
   app's local settings (`apiBaseUrl` = `http://localhost:3000` locally, or
   the deployed Vercel URL).

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
   expiry"** in the sidebar app -- same simulated-time-compression idea,
   just as a manual agent action instead of a timer.

## Seed data

`apps/web` ships a seed script (`npm run seed --workspace=apps/web`) that
wipes the demo collections and loads a small catalog of demo plans/add-ons
named to match real XL product conventions (e.g. `GoSurf799`). Safe to
re-run any time you want a clean slate -- but note it deletes every
Customer/Cart/Order/Voucher/InteractionEvent in whatever `MONGODB_URI`
points at, so double-check that variable before running it against
anything other than a disposable dev/demo cluster.
