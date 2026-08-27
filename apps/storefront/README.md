# @oneix/storefront

**XLSmart** -- the public demo storefront for the Ravta story: a
campaign-aware landing page, a Connectivity Builder that recommends one
plan (not a generic list), mobile+OTP identity verification ("save my
setup"), activation, and a support-contact form. Also the landing target
for the CDP nudge email link (`/setup/:cartId`, see
[../../docs/email-templates.md](../../docs/email-templates.md)).

No accounts, no real signup/login -- identity is resolved by mobile
number/email, and the "OTP" is a demo code logged server-side, not real SMS
(see [../../docs/architecture.md](../../docs/architecture.md)).

See [../../docs/architecture.md](../../docs/architecture.md) and
[../../docs/api-spec.md](../../docs/api-spec.md).

Status: implemented. Setup state lives in a persisted zustand store
(`src/store/cartStore.ts`) keyed by `cartId`, but the setup's *contents* are
always re-fetched from `api` rather than trusted from local state, since the
CDP sweep can change it server-side (sending a nudge) while a tab sits open.

```
cp .env.example .env    # VITE_API_BASE_URL
npm run dev
```
