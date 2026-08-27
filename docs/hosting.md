# Hosting (free tiers)

This is a demo, so every piece runs on a free tier. That constrains a couple
of design choices below — noted inline.

| Piece | Where | Free tier | Notes |
|---|---|---|---|
| `storefront` | **Vercel** | yes, no card required | static Vite/React build, zero-config framework detection |
| `api` | **Render** (Web Service) | yes, no card required | spins down after ~15 min idle; cold start on the next request. See "Keeping the sweep alive" below |
| database | **Neon** (Postgres) | yes, no card required | serverless Postgres, scales to zero when idle, wakes automatically on connect — used for both local dev and the hosted demo |
| email | **Ethereal** (via Nodemailer) | yes, no signup at all | disposable inbox auto-created per run; `api` logs a preview URL for every send |
| Zendesk ticketing | **Zendesk trial/sandbox** | 14-day free trial | the ticket system itself; the sidebar app is uploaded into it, not hosted separately |
| `zendesk-app` | hosted **by Zendesk** | included with the trial | once built and uploaded as a private app (`.zip`), Zendesk serves the sidebar app's assets itself — no separate static host needed. Local dev instead uses `zat server`, which tunnels the app from your machine |

Nothing here needs a credit card. Re-provisioning any piece if a free trial
lapses (mainly the Zendesk trial) is a matter of re-running the steps below
against a new instance.

## storefront → Vercel

1. Import the repo into Vercel, set the project's **root directory** to
   `apps/storefront` (Vercel supports this per-project in a monorepo — no
   `vercel.json` needed, Vite is auto-detected).
2. Set env var `VITE_API_BASE_URL` to the deployed `api` URL (from Render,
   below).
3. Every push to `main` redeploys automatically.

## api → Render

1. New → Web Service, root directory `apps/api`, build command
   `npm install && npx prisma generate && npm run build`, start command
   `npm start`, instance type **Free**.
2. Set the env vars from `apps/api/.env.example` (`DATABASE_URL` from Neon,
   `STOREFRONT_URL` = the Vercel URL, `INTERNAL_API_TOKEN`, Zendesk
   credentials, etc).
3. Enable CORS on `api` for the Vercel origin — the storefront and the API
   are on different domains once hosted (`app.use(cors({ origin: STOREFRONT_URL }))`
   or equivalent).

A `render.yaml` blueprint at the repo root captures this so the service can
be created with **New → Blueprint** instead of clicking through manually —
see [../render.yaml](../render.yaml).

### Keeping the sweep alive

Render's free web services spin down after ~15 minutes idle and only wake on
an inbound HTTP request — an in-process `node-cron` timer stops firing while
the service is asleep. The CDP sweep needs an external nudge to work around
this: since detecting "saved, no purchase, high intent" *is* the
timer-driven part (nothing "reads" its way into discovering a cart went
idle), something has to hit `api` periodically from outside. Point a free
external scheduler — [cron-job.org](https://cron-job.org) (no account
limits worth worrying about for a demo) or Render's own Cron Jobs if
available on your plan — at `POST /api/internal/demo/force-sweep` every
1–2 minutes. This double-duties as what keeps the free web service from
fully cold-starting between demo runs.

For a live, hands-on demo (as opposed to "leave it running and let people
poke at it"), you don't need the external scheduler at all — just hit the
force-sweep endpoint manually at the right story beat, per
[demo-setup.md](demo-setup.md).

## database → Neon

1. Create a free Neon project, copy the pooled connection string into
   `DATABASE_URL` (both locally, in `apps/api/.env`, and in Render's env
   vars).
2. `npm run prisma:migrate --workspace=apps/api` against it once to create
   the schema, then `npm run seed --workspace=apps/api`.

Using the same Neon database for local dev and the hosted demo avoids the
classic "works on SQLite, breaks on Postgres" gap — there's only one
provider to test against.

## Zendesk

The Zendesk side isn't "hosted" by us at all — it's a trial/sandbox Zendesk
instance (free for 14 days, renewable by creating a new trial if a demo needs
to outlive that window) that hosts the ticket system and, once the app is
uploaded, the sidebar app's assets too. See
[zendesk-app.md](zendesk-app.md) and [demo-setup.md](demo-setup.md) for
setup.
