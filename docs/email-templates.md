# Transactional Emails

Sent by `apps/api` via the `EmailProvider` interface (default implementation:
Nodemailer + Ethereal — see [demo-setup.md](demo-setup.md)). Two templates
needed for the demo.

## 1. Abandoned-cart coupon email

Triggered by `POST /api/internal/carts/:cartId/coupons` (the agent's "Send
20% coupon" click).

- **To**: `Cart.customerId → Customer.email`
- **Subject**: `You left something behind — here's 20% off`
- **Body** (plain-language content, not final copy):
  - "You just got a 20% off coupon that can be used to buy **{product
    name}**."
  - Coupon code, spelled out.
  - Explicit expiry: "This expires in 15 minutes."
  - A link back to the storefront: `{storefrontUrl}/cart/{cartId}?coupon={code}`
    — restores the cart and pre-fills the coupon at checkout.

## 2. Order confirmation

Triggered by `POST /api/carts/:id/checkout/complete` on success.

- **To**: customer email
- **Subject**: `Order confirmed — {order id}`
- **Body**: line items, subtotal, discount (if a coupon was applied), total,
  "no real payment was processed — this is a demo."

## Delivery in the demo

Ethereal generates a disposable inbox per run and Nodemailer returns a
preview URL for every send, which `api` logs to the console
(`Email preview: https://ethereal.email/message/...`). That preview link is
what you show live in the demo instead of a real inbox — no SMTP credentials
or real email account required. Swapping in a real provider later only means
implementing `EmailProvider.send()` against that provider's API/SMTP and
setting env vars; nothing else in `api` changes.
