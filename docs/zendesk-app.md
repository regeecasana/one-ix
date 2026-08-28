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

If a ticket *isn't* linked (`404`) -- e.g. one created outside the demo
flow -- the app falls back to the requester's email (`client.get`
`('ticket.requester.email')`) and looks the customer up that way instead
of just showing an empty state.

## UI (single view, no routing needed)

0. **Find customer by email** -- always visible at the top. Pre-filled
   with the ticket requester's email (if any), editable, so an agent can
   pull up any customer's profile regardless of which ticket they're on.
   This is also what powers the not-linked fallback above.
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
   - *Order placed* -> "Activated -- order #... for Rp ...", no further
     action needed.
4. **AI insight** -- on-demand only (never automatic, same principle as
   voucher issuance): a **"Get AI insight"** button that sends the
   customer's profile (setup, voucher history, recent-activity timeline --
   the same data already mirrored onto the ticket as comments, so this is
   the ticket's real content without a second fetch back to Zendesk) to
   OpenAI and renders back a short, actionable read of the situation. See
   `generateInsight` in `apps/web/src/lib/services/insightService.ts`.
   Requires `OPENAI_API_KEY` on `apps/web`; without it the button reports
   a graceful "not configured" message instead of failing.
5. **Close ticket** -- always available, always an explicit click. Clears
   `Customer.activeTicketId` so the next interaction opens a fresh ticket.

Every action here is one click (or one search) -- same "keep the agent's
job to one deliberate action" principle as every earlier version of this
sidebar app design. The AI insight is explicitly read-only assistance: it
never issues a voucher or takes any action itself, the agent still decides
and clicks.

## Auth

`apiBaseUrl` and `internalToken` (sent as `X-Internal-Token`), set once at
app install time via Zendesk's app installation parameters, not committed
to source. `/api/internal/*` and `/api/products` allow cross-origin
requests (see `apps/web/src/middleware.ts`) since this app runs on a
different origin than `apps/web` itself -- the internal routes stay
protected by the token regardless of origin.

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
