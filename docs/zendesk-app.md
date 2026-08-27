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

Tickets in this build only ever come from one place: Ravta emailing
support (`POST /api/support/tickets`). That call creates a `SupportTicket`
row mapping `zendeskTicketId → customerId` at creation time, so the app
just needs the ticket id (`client.get('ticket.id')`) and calls
`GET /api/internal/tickets/:ticketId/customer` to resolve it — no custom
field or tag parsing needed.

## UI (single view, no routing needed)

1. **Loading** — while the customer id and then
   `GET /api/internal/customers/:customerId/profile` resolve.
2. **Unified Profile** — the whole point of this app:
   - How they found XLSmart (campaign/source, if any).
   - Their saved setup: recommended plan + why, and whether it's been
     activated.
   - Current XL Points balance.
   - Recent support contacts.
3. **Grant goodwill points** — an amount field (a couple of preset buttons,
   e.g. 1,000 / 2,000 / 5,000, plus a reason) and a single **"Grant
   points"** action. Calls
   `POST /api/internal/customers/:customerId/points`, then re-fetches the
   profile so the new balance shows immediately. This is the one
   agent-facing action the demo hinges on — same "one click, no form
   beyond a reason" shape the old coupon button had.

There's no AI-diagnosis step in this build — the ticket goes straight to a
human agent, and the value this app adds is *not having to ask who Ravta
is*, not automating the resolution itself.

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
