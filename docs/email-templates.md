# Transactional Emails

Sent by `apps/api` via the `EmailProvider` interface (default implementation:
Nodemailer + Ethereal — see [demo-setup.md](demo-setup.md)). Three templates
needed for the demo.

## 1. Setup-saved nudge (the CDP email)

Triggered by the CDP sweep job when it finds a saved-but-not-activated cart.

- **To**: `Cart.customerId → Customer.email`
- **Subject**: `Your Creator Setup is still saved`
- **Body** (plain-language content, not final copy):
  - "Hi {name}, your Creator Setup is still saved."
  - "Complete your activation today and receive another 5,000 XL points."
  - A link back to the storefront: `{storefrontUrl}/setup/{cartId}` —
    restores the setup and continues straight to activation. No code to
    apply — the points bonus is automatic on completion.

## 2. Activation confirmation

Triggered by `POST /api/carts/:id/checkout/complete` on success.

- **To**: customer email
- **Subject**: `Your setup is active — {order id}`
- **Body**: line items, subtotal, total, points earned this order (5,000
  base + 5,000 completion bonus if this followed a CDP nudge), "no real
  payment was processed — this is a demo."

## 3. Goodwill points granted

Triggered by `POST /api/internal/customers/:customerId/points` (an agent
resolving a support ticket).

- **To**: customer email
- **Subject**: `You've received {amount} XL points`
- **Body**: the amount granted, the reason the agent gave, new balance.

## Delivery in the demo

Ethereal generates a disposable inbox per run and Nodemailer returns a
preview URL for every send, which `api` logs to the console
(`Email preview: https://ethereal.email/message/...`). That preview link is
what you show live in the demo instead of a real inbox — no SMTP credentials
or real email account required. Swapping in a real provider later only means
implementing `EmailProvider.send()` against that provider's API/SMTP and
setting env vars; nothing else in `api` changes.
