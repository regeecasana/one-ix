# @oneix/zendesk-app

Zendesk Apps Framework (ZAF) v2 ticket sidebar app. Shows the customer
profile behind an activity ticket -- saved setup, the live interaction
timeline (every click, save, and activation), and any active voucher --
and lets an agent issue or resend a time-limited voucher in one click.
Also: a "find customer by email" search (defaults to the ticket
requester's email, editable, and the fallback when a ticket isn't linked
to any customer) and an on-demand "Get AI insight" button that summarizes
the customer's activity via OpenAI.

See [../../docs/zendesk-app.md](../../docs/zendesk-app.md) for the full
design (ticket → customer resolution, UI states, auth) and
[../../docs/demo-setup.md](../../docs/demo-setup.md) for wiring it up
against a Zendesk trial account.

Status: implemented and verified against the deployed API (see
[../../docs/roadmap.md](../../docs/roadmap.md)) -- not yet installed
against a live Zendesk trial instance.

Requires the Zendesk Apps Tools CLI: `npm install -g @zendesk/zendesk-apps-tools`.

```
npm run build   # bundle React app into assets/
npm run serve   # zat server, for local iteration against a real ticket
```
