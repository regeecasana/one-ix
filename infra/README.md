# infra/

Docker Compose setup for running `api` and `storefront` locally, for
development only.

This is **not** how the demo gets deployed. The hosted version runs on
Vercel (storefront), Render (api), and Neon (database) with no Docker
involved at all — see [../docs/hosting.md](../docs/hosting.md). This
directory exists purely so you can `docker compose up` and get a working,
hot-reloading local stack without installing Postgres or Node locally, or to
have an environment that matches CI/teammates exactly.

`apps/zendesk-app` isn't part of this compose file — it's developed against
a real Zendesk trial instance via `zat server`, which isn't something Docker
adds value to. See [../docs/demo-setup.md](../docs/demo-setup.md).

## Prerequisites

- Docker Desktop (or another Docker Engine + Compose v2)
- `apps/api/.env` and `apps/storefront/.env`, copied from their
  `.env.example` files (see [../docs/demo-setup.md](../docs/demo-setup.md)).
  `DATABASE_URL`, `STOREFRONT_URL`, and `PORT` are overridden by
  `docker-compose.yml` to point at the containerized Postgres and the
  container network, so what's in `.env` for those three doesn't matter
  here — but `INTERNAL_API_TOKEN` and the `ZENDESK_*` vars still come from
  your `.env` file if you want to exercise the Zendesk side while running
  the app in Docker.

## Running

```
cd infra
docker compose up --build
```

- storefront: http://localhost:5173
- api: http://localhost:4000/health
- postgres: `localhost:5432`, user/pass/db all `oneix`

The api container runs `prisma generate` and `prisma db push` against the
containerized Postgres on startup, so the schema is always in sync with
`apps/api/prisma/schema.prisma` without a manual migration step.

Both `api` and `storefront` source directories are bind-mounted into their
containers, so edits on the host hot-reload inside the container (`tsx
watch` for the api, Vite's dev server for the storefront) — no rebuild
needed for code changes. Rebuild (`docker compose up --build`) only when a
`package.json` changes.

## Seeding data

```
docker compose exec api npm run seed --workspace=apps/api
```

## Tearing down

```
docker compose down          # stop containers, keep the postgres volume
docker compose down -v       # also wipe the postgres volume
```
