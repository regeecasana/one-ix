# Zendesk Ticket Sidebar App

`apps/zendesk-app` is a **ticket sidebar location** app built with the
Zendesk Apps Framework (ZAF) v2 and React, developed/served locally with
the Zendesk Apps Tools (`zat`) CLI and packaged as a `.zip` for install
into a Zendesk trial/sandbox instance.

## Where it lives

```json
{ "location": { "support": { "ticket_sidebar": "assets/iframe.html" } } }
```

## What it needs from the host ticket

Every ticket in this build is created by `POST /api/identify` the first
time a customer's email is captured, and reused for all their subsequent
interaction comments until an agent closes it (see
[data-model.md](data-model.md)). The app calls
`GET /api/internal/tickets/:ticketId/customer` with `client.get('ticket.id')`
to resolve the customer -- no custom field or tag parsing needed.

## UI (single view, no routing needed)

1. **Loading** -- while the customer id and then
   `GET /api/internal/customers/:customerId/profile` resolve.
2. **Profile** -- email, most recent setup (items, recommendation reason),
   a short recent-activity list (the same events already visible as
   ticket comments, surfaced here too so the agent doesn't have to scroll
   the ticket to see the last few), and any active voucher.
3. **Issue/resend a voucher**:
   - *No voucher issued* -> pick the product (defaults to the most recent
     setup item) and click **"Send 20% voucher"**.
   - *Voucher active* -> code, expiry countdown.
   - *Voucher expired, unused* -> **"Resend with extended expiry"** -- this
     is what "check back the next day" looks like as a click.
   - *Order placed* -> "Activated -- order #... for $...", no further
     action needed.
4. **Close ticket** -- always available, always an explicit click. Clears
   `Customer.activeTicketId` so the next interaction opens a fresh ticket.

Both voucher actions and the close action are one click each, no forms
beyond picking a product -- same "keep the agent's job to one deliberate
action" principle as every earlier version of this sidebar app design.

## Auth

`apiBaseUrl` and `internalToken` (sent as `X-Internal-Token`), set once at
app install time via Zendesk's app installation parameters, not committed
to source.

## Local development

```
cd apps/zendesk-app
npm run build      # bundles the React app into assets/
zat server          # serves the app locally
```

Enable "local apps" in a Zendesk trial account's Admin Center and point it
at the `zat server` URL to iterate against a real ticket sidebar.

## Packaging

`zat package` produces the `.zip` uploaded via Admin Center -> Apps ->
Manage -> Upload private app.
