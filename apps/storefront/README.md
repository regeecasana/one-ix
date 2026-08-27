# @oneix/storefront

**Relay** -- the public demo storefront, themed as a telco: SIMs, phones,
a hotspot, a router, earbuds. Catalog, product detail, cart, checkout
("Activate", mock payment), and order confirmation. Also the landing target
for the abandoned-cart coupon email link
(`/cart/:cartId?coupon=...`, see [../../docs/email-templates.md](../../docs/email-templates.md)).

No accounts, no signup/login -- checkout is guest-only (email capture), by
design (see [../../docs/roadmap.md](../../docs/roadmap.md)'s out-of-scope list).

See [../../docs/architecture.md](../../docs/architecture.md) and
[../../docs/api-spec.md](../../docs/api-spec.md).

Status: implemented. Cart state lives in a persisted zustand store
(`src/store/cartStore.ts`) keyed by `cartId`, but the cart's *contents* are
always re-fetched from `api` rather than trusted from local state, since an
agent can change it server-side (issuing a coupon) while a tab sits open.

```
cp .env.example .env    # VITE_API_BASE_URL
npm run dev
```
