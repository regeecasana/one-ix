# Running the Demo

This covers **local dev**. To run the hosted version (Vercel + Bird), see
[hosting.md](hosting.md) -- the env vars are the same either way, since
local dev and production point at the same Bird workspace.

`apps/zendesk-app` is developed separately (via `zat server` against a real
Zendesk trial instance) -- it isn't part of `apps/web`'s dev server.

## Prerequisites

- Node.js 20+
- A [Bird](https://app.bird.com) workspace + API key, with the Custom
  Object types and Contact attribute from
  [architecture.md](architecture.md)'s "Storage: Bird CDP" section
  already created in the dashboard.
- A Zendesk trial/sandbox account with an API token and the Zendesk Apps
  Tools CLI: `npm install -g @zendesk/zendesk-apps-tools`.

## One-time setup

```
npm install
cp apps/web/.env.example apps/web/.env.local
npm run seed --workspace=apps/web
```

Fill in `apps/web/.env.local`:

| var | purpose |
|---|---|
| `BIRD_API_KEY` / `BIRD_WORKSPACE_ID` / `BIRD_REGION` | Bird workspace credentials |
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

`apps/web` ships a seed script (`npm run seed --workspace=apps/web`, source
at `apps/web/scripts/seedBird.ts`) that wipes the demo Custom Object
records and loads a small catalog of demo plans/add-ons named to match
real XL product conventions (e.g. `GoSurf799`). Safe to re-run any time
you want a clean slate -- but note it deletes every Product/Cart/Order/
Voucher/SupportTicket record (and re-upserts the two demo Contacts) in
whatever `BIRD_WORKSPACE_ID` points at, so double-check that variable
before running it against anything other than a disposable dev/demo
workspace.
