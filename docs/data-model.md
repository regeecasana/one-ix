# Data Model

Owned entirely by `apps/api` (Prisma). This is the intended shape -- the
authoritative schema lives at `apps/api/prisma/schema.prisma`.

Third shape this model has taken. What changed this round: `mobileNumber`/
`pointsBalance` are gone from `Customer` (no more OTP, no more points --
see [user-stories.md](user-stories.md)); a `Voucher` model is back (this
time scoped to a customer + product, not a cart); a new `InteractionEvent`
model captures the live activity log that gets mirrored to Zendesk as
ticket comments; `Customer` gained `activeTicketId` so there's one ticket
per "engagement" that interactions get posted to until an agent closes it.

## Entities

### Customer
| field | type | notes |
|---|---|---|
| id | string (cuid) | |
| email | string, unique | the only identity signal in this build |
| name | string? | optional |
| activeTicketId | string? | the Zendesk ticket currently receiving this customer's interaction comments; cleared when an agent closes it -- the next interaction after that opens a fresh one |
| createdAt | datetime | |

### Product
Unchanged -- connectivity plans and add-ons, named to match real XL
product conventions (e.g. `GoSurf799`).

### Cart
The in-progress **setup**.

| field | type | notes |
|---|---|---|
| id | string | |
| customerId | string? | nullable until the email popup resolves identity |
| status | enum: `active`, `converted` | no more `abandoned` status -- abandonment is something the *agent* reads off the interaction log, not a state the system flags itself |
| lastActivityAt | datetime | |
| utmSource / utmCampaign / utmContent | string? | campaign attribution, folded into the first interaction comment if present |
| recommendationReason | string? | the Connectivity Builder's "why this plan" text |
| createdAt / updatedAt | datetime | |

### CartItem / Order / OrderItem
Unchanged in shape from the previous round.

### Voucher
Scoped to a specific customer + product (not a cart -- a voucher survives
even if the customer starts a fresh setup).

| field | type | notes |
|---|---|---|
| id | string | |
| code | string, unique | e.g. `SAVE20-9F3K...` |
| customerId | string | |
| productId | string | which plan/add-on this discount applies to |
| percentOff | int | `20` for the primary flow |
| status | enum: `active`, `redeemed`, `expired` | |
| expiresAt | datetime | `createdAt + 30m` by default, agent-adjustable |
| issuedBy | enum: `agent` | always agent-issued, never automatic |
| resendCount | int, default 0 | incremented each time an agent extends/resends -- what "checked back the next day" looks like in the data |
| zendeskTicketId | string? | the ticket this was issued from |
| createdAt | datetime | |

### InteractionEvent
The customer-behavior half of the activity log (the other half is agent
actions, which go straight to Zendesk comments without a local row -- see
[api-spec.md](api-spec.md)).

| field | type | notes |
|---|---|---|
| id | string | |
| customerId | string | |
| type | string | e.g. `viewed_product`, `added_to_setup`, `removed_from_setup`, `answered_builder_step`, `tab_closed`, `returned_to_setup`, `activated` |
| detail | string | human-readable, this is literally what gets posted as the Zendesk comment body |
| createdAt | datetime | |

## Relationships

```
Customer 1──* Cart 1──* CartItem *──1 Product
Cart 1──? Order 1──* OrderItem
Customer 1──* Voucher *──1 Product
Customer 1──* InteractionEvent
Customer 1──* SupportTicket   (unchanged, separate flow -- see api-spec.md)
```

## Key invariants

- A `Voucher` is only ever created by an explicit agent action from the
  sidebar app -- never automatically. Sending one, resending/extending
  one, and closing the ticket are each a deliberate click.
- At most one `active` voucher per customer+product pair at a time --
  issuing a new one for the same product supersedes the old one.
- `Order.totalCents` only reflects a voucher discount when that voucher's
  `status` is `active` **and** `expiresAt > now`, checked server-side at
  checkout -- never trusted from the client.
- `InteractionEvent` rows are append-only and are posted to
  `Customer.activeTicketId` as they're created. If `activeTicketId` is
  null (Zendesk not configured, or between an agent closing one ticket and
  the next interaction), the event still persists locally -- the Zendesk
  post is a side effect, not the source of truth for the log.
