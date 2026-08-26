# Zendesk Ticket Sidebar App

`apps/zendesk-app` is a **ticket sidebar location** app built with the
Zendesk Apps Framework (ZAF) v2 and React, developed/served locally with the
Zendesk Apps Tools (`zat`) CLI and packaged as a `.zip` for install into a
Zendesk trial/sandbox instance.

## Where it lives

Zendesk apps declare their mount point in `manifest.json`:

```json
{
  "location": {
    "support": {
      "ticket_sidebar": "assets/iframe.html"
    }
  }
}
```

The app only ever renders inside the ticket sidebar — it has no other
surface.

## What it needs from the host ticket

The app must resolve *which cart* the current ticket is about. Two viable
approaches, either works and both should be supported so the demo isn't
fragile to how the ticket was created:

1. **Ticket field**: the sweep job sets a Zendesk ticket field (custom field,
   e.g. `cart_id`) when it creates the ticket. The app reads it via the ZAF
   `client.get('ticket.customField:cart_id')`.
2. **Fallback via tag + lookup**: if no custom field is present (e.g. a
   manually created ticket), the app calls
   `GET /api/internal/tickets/:ticketId/cart` and lets `api` resolve it
   however it can (e.g. matching requester email to a recent abandoned cart).

## UI (single view, no routing needed)

1. **Loading** — while `GET /api/internal/carts/:cartId/summary` resolves.
2. **Cart summary** — item(s), quantities, subtotal, customer email.
3. **Coupon state**, one of:
   - *No coupon issued* → primary button **"Send 20% coupon"**.
   - *Coupon active* → code, percent off, countdown to `expiresAt`.
   - *Coupon expired* → greyed-out state, "expired unused", optional
     **"Send another coupon"** button.
   - *Order placed* → "Recovered — order #… for $…", no further action.
4. Clicking **"Send 20% coupon"** calls
   `POST /api/internal/carts/:cartId/coupons`, then re-fetches the summary to
   move into the *active* state. This is the single agent-facing action the
   whole demo hinges on — keep it one click, no form.

## Auth

The app is configured (via `secure_settings` / app installation parameters,
not hardcoded) with:

- `apiBaseUrl` — where `api` is reachable.
- `internalToken` — the shared secret sent as `X-Internal-Token` on every
  call to `api`'s internal endpoints.

Both are set once at app install time in the Zendesk admin UI (Manage → Apps
→ your app → Settings), not committed to source.

## Local development

Standard ZAF loop:

```
cd apps/zendesk-app
npm run build      # bundles the React app into assets/
zat server          # serves the app locally
```

Then in a Zendesk trial account, enable "local apps" in Admin Center and
point it at the `zat server` URL to see live changes in a real ticket
sidebar without repackaging on every change.

## Packaging

`zat package` produces the `.zip` uploaded via Admin Center → Apps →
Manage → Upload private app, for anyone re-running the demo without a local
dev server.
