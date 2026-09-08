# Hosting

`apps/web` is a single Next.js app (storefront + API) deployed as one
Vercel project. There's no separate backend host and no CORS to configure
-- the storefront and API are the same origin.

| Piece | Where | Notes |
|---|---|---|
| `apps/web` (storefront + api) | **Vercel** | one project, Root Directory set to `apps/web`; every push to `main` redeploys |
| storage | **Bird** (app.bird.com) | one workspace for local dev and production -- see [architecture.md](architecture.md)'s "Storage: Bird CDP" |
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
| `BIRD_API_KEY` / `BIRD_WORKSPACE_ID` / `BIRD_REGION` | Bird workspace credentials -- see [architecture.md](architecture.md)'s "Storage: Bird CDP" |
| `SESSION_SECRET` | signs the per-customer session token (see [api-spec.md](api-spec.md)) -- set this explicitly in production; the random-per-process fallback used for local dev would invalidate sessions on every cold start |
| `INTERNAL_API_TOKEN` | shared secret the Zendesk sidebar app sends as `X-Internal-Token` |
| `ZENDESK_SUBDOMAIN` / `ZENDESK_EMAIL` / `ZENDESK_API_TOKEN` | Zendesk API auth |
| `VOUCHER_TTL_MINUTES` | default `30`, matches the story |
| `NEXT_PUBLIC_SITE_URL` | optional -- only needed for a custom domain; Vercel's `VERCEL_URL` covers the default `*.vercel.app` deployment automatically |

## storage → Bird

1. Create a Bird workspace + API key (Developers → API keys). Note the
   workspace id and the key's region prefix (`bk_us1_...` → `us1`,
   `bk_eu1_...` → `eu1`).
2. In that workspace's dashboard, add the custom Contact attribute and
   create the Custom Object types listed in [architecture.md](architecture.md)'s
   "Storage: Bird CDP" section (fields/unique keys are in
   [data-model.md](data-model.md)) -- this is manual, app code can't
   create Custom Object *types*, only records within them.
3. Set `BIRD_API_KEY` / `BIRD_WORKSPACE_ID` / `BIRD_REGION`, both locally
   (`apps/web/.env.local`) and in Vercel's project env vars.
4. `npm run seed --workspace=apps/web` to populate the demo catalog and
   two demo customers.

Using the same Bird workspace for local dev and the hosted demo means
there's only one place to keep Custom Object definitions in sync.

## Zendesk

The Zendesk side isn't "hosted" by us at all -- it's a trial/sandbox
Zendesk instance (free for 14 days, renewable by creating a new trial if a
demo needs to outlive that window) that hosts the ticket system and, once
the app is uploaded, the sidebar app's assets too. See
[zendesk-app.md](zendesk-app.md) and [demo-setup.md](demo-setup.md) for
setup.
