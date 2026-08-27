# @oneix/api

Backend for the oneix demo. Owns the data model and every side effect
(email, Zendesk API calls, background jobs). See:

- [../../docs/architecture.md](../../docs/architecture.md)
- [../../docs/data-model.md](../../docs/data-model.md)
- [../../docs/api-spec.md](../../docs/api-spec.md)
- [../../docs/demo-setup.md](../../docs/demo-setup.md)

Status: implemented -- products, carts, checkout (mock payment), coupons,
the abandoned-cart sweep, coupon expiry, Zendesk ticket/comment calls
(no-op with a logged warning if Zendesk credentials aren't set), and email
via Ethereal are all in place. `apps/storefront` and `apps/zendesk-app` are
still scaffolds -- see [../../docs/roadmap.md](../../docs/roadmap.md).

```
cp .env.example .env
npm run prisma:migrate     # or, against infra/'s docker postgres: npm run db:push
npm run seed
npm run dev
```

`GET /health` for a liveness check; see
[../../docs/api-spec.md](../../docs/api-spec.md) for the full route list.
