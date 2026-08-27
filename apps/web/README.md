# @oneix/web

The XLSmart connectivity storefront and its API in one Next.js app: email
identification, live interaction logging into Zendesk, agent-issued
vouchers, and checkout. Deploys as a single Vercel project; data lives in
MongoDB Atlas (Prisma).

```
src/
  app/            App Router pages (client components) + api/ Route Handlers
  components/     Header, ProductCard, EmailPopup, etc.
  store/          Zustand cart/identity store (persisted, session-token-aware)
  lib/            services/, email/, zendesk/, session.ts, db.ts, apiHelpers.ts
prisma/
  schema.prisma   MongoDB datasource
  seed.ts         demo product catalog
```

See [../../docs/demo-setup.md](../../docs/demo-setup.md) for local setup
and [../../docs/hosting.md](../../docs/hosting.md) for deploying.

```
npm run dev --workspace=apps/web     # http://localhost:3000
npm run build --workspace=apps/web   # prisma generate && next build
npm run seed --workspace=apps/web    # reseed the product catalog (destructive -- see demo-setup.md)
npm run db:push --workspace=apps/web # sync Mongo indexes with schema.prisma
```
