# Transactional Emails

Sent by `apps/web` via the `EmailProvider` interface (default implementation:
Nodemailer + Ethereal -- see [demo-setup.md](demo-setup.md)). Two templates.

## 1. Voucher email

Triggered by `POST /api/internal/customers/:customerId/vouchers` (agent
issues) and `POST /api/internal/vouchers/:voucherId/resend` (agent
extends/resends -- same template, updated expiry).

- **To**: customer email
- **Subject**: `Here's 20% off {product name}`
- **Body** (plain-language content, not final copy):
  - "You were checking out {product name} -- here's 20% off if you want
    to finish setting it up."
  - Voucher code, spelled out.
  - Explicit expiry: "This expires in 30 minutes."
  - A link back to the storefront: `{storefrontUrl}/cart/{cartId}?voucher={code}`

## 2. Activation confirmation

Triggered by `POST /api/carts/:id/checkout/complete` on success.

- **To**: customer email
- **Subject**: `Your setup is active -- {order id}`
- **Body**: line items, subtotal, discount (if a voucher was applied),
  total, "no real payment was processed -- this is a demo."

## Delivery in the demo

Ethereal generates a disposable inbox per run and Nodemailer returns a
preview URL for every send, which `api` logs to the console
(`Email preview: https://ethereal.email/message/...`). That preview link is
what you show live in the demo instead of a real inbox.
