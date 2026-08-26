# @oneix/zendesk-app

Zendesk Apps Framework (ZAF) v2 ticket sidebar app. Shows the abandoned
cart behind a ticket and lets an agent issue a 20%-off, 15-minute coupon in
one click.

See [../../docs/zendesk-app.md](../../docs/zendesk-app.md) for the full
design (ticket → cart resolution, UI states, auth) and
[../../docs/demo-setup.md](../../docs/demo-setup.md) for wiring it up
against a Zendesk trial account.

Status: scaffolded, not yet implemented (see [../../docs/roadmap.md](../../docs/roadmap.md)).

Requires the Zendesk Apps Tools CLI: `npm install -g @zendesk/zendesk-apps-tools`.

```
npm run build   # bundle React app into assets/
npm run serve   # zat server, for local iteration against a real ticket
```
