# Hosting

`apps/web` is a single Next.js app (storefront + API) deployed as one
Vercel project. There's no separate backend host and no CORS to configure
-- the storefront and API are the same origin.

| Piece | Where | Notes |
|---|---|---|
| `apps/web` (storefront + api) | **Vercel** | one project, Root Directory set to `apps/web`; every push to `main` redeploys |
| database | **MongoDB Atlas** | same connection string for local dev and production -- no local-vs-hosted drift |
| email | **Ethereal** (via Nodemailer) | disposable inbox auto-created per run; the app logs a preview URL for every send |
| Zendesk ticketing | **Zendesk trial/sandbox** | 14-day free trial; the sidebar app is uploaded into it, not hosted separately |
| `zendesk-app` | hosted **by Zendesk** | once built and uploaded as a private app (`.zip`), Zendesk serves the sidebar app's assets itself. Local dev instead uses `zat server`, which tunnels the app from your machine |

## apps/web → Vercel

This is an npm-workspaces monorepo, so the Vercel project needs two
non-default settings (one-time, via the dashboard or `vercel api`):

1. **Root Directory**: `apps/web`. Vercel then auto-detects it's part of an
   npm workspace and runs `npm install` from the repo root (so
   `@oneix/shared` resolves) before running `apps/web`'s own build.
2. **Framework Preset**: `Next.js` (should auto-detect once Root Directory
   is correct; if a deploy fails with "No Output Directory named public
   found", the framework preset got reset to "Other" -- set it back
   explicitly).

Env vars (Project Settings → Environment Variables), same names as
`apps/web/.env.example`:

| var | purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string. Named to match what Vercel's MongoDB Atlas integration auto-injects if you add that integration instead of setting it by hand |
| `SESSION_SECRET` | signs the per-customer session token (see [api-spec.md](api-spec.md)) -- set this explicitly in production; the random-per-process fallback used for local dev would invalidate sessions on every cold start |
| `INTERNAL_API_TOKEN` | shared secret the Zendesk sidebar app sends as `X-Internal-Token` |
| `ZENDESK_SUBDOMAIN` / `ZENDESK_EMAIL` / `ZENDESK_API_TOKEN` | Zendesk API auth |
| `VOUCHER_TTL_MINUTES` | default `30`, matches the story |
| `NEXT_PUBLIC_SITE_URL` | optional -- only needed for a custom domain; Vercel's `VERCEL_URL` covers the default `*.vercel.app` deployment automatically |

## database → MongoDB Atlas

1. Create a free Atlas cluster (M0 is enough -- it's still a replica set,
   which Prisma's MongoDB connector requires for the `$transaction` calls
   in voucher issuance and checkout).
2. Copy the connection string into `MONGODB_URI`, both locally
   (`apps/web/.env` and `.env.local`) and in Vercel's project env vars.
3. `npm run db:push --workspace=apps/web` against it once to create the
   unique indexes (email, voucher code, cart↔order), then
   `npm run seed --workspace=apps/web`.

Using the same Atlas cluster for local dev and the hosted demo means
there's only one database to keep schema/indexes in sync on.

## Zendesk

The Zendesk side isn't "hosted" by us at all -- it's a trial/sandbox
Zendesk instance (free for 14 days, renewable by creating a new trial if a
demo needs to outlive that window) that hosts the ticket system and, once
the app is uploaded, the sidebar app's assets too. See
[zendesk-app.md](zendesk-app.md) and [demo-setup.md](demo-setup.md) for
setup.
