# Data Model

Owned entirely by `apps/web`, stored in **Bird** (app.bird.com) -- see
[architecture.md](architecture.md)'s "Storage: Bird CDP" section for why.
`Customer` and `InteractionEvent` are Bird **Contacts** (authoritative
client: `apps/web/src/lib/bird/client.ts`); everything else is a Bird
**Custom Object**, defined via the dashboard's Schema Explorer, not by a
schema file in this repo (authoritative client:
`apps/web/src/lib/bird/objects.ts`, record shapes in
`apps/web/src/lib/bird/types.ts`).

Previously Prisma/MongoDB. What changed this round: storage moved to Bird;
`CartItem`/`OrderItem` are no longer separate entities -- each is now a
JSON array attribute embedded directly on its parent `Cart`/`Order`
object, since Bird's Custom Object search has no join and does support
array-valued attributes; a new `activity_tickets` object was added purely
to bridge a Zendesk ticket id back to a Bird contact id (see
architecture.md for why). Field-level shapes are otherwise unchanged from
the previous Prisma round.

## Entities

### Customer (Bird Contact)
| field | type | notes |
|---|---|---|
| id | string, Bird-assigned | the canonical `customerId` used by every other object below |
| email | string, identifier | the only identity signal in this build |
| name (`firstName` attribute) | string? | optional |
| activeTicketId | string? custom attribute | the Zendesk ticket currently receiving this customer's interaction comments; cleared when an agent closes it -- the next interaction after that opens a fresh one |
| createdAt | datetime | |

### Product (Custom Object `products`)
Unchanged -- connectivity plans and add-ons, named to match real XL
product conventions (e.g. `GoSurf799`). `id` unique.

### Cart (Custom Object `carts`)
The in-progress **setup**.

| field | type | notes |
|---|---|---|
| id | string, Bird-assigned | |
| customerId | string? | nullable until the email popup resolves identity |
| status | enum: `active`, `converted` | no more `abandoned` status -- abandonment is something the *agent* reads off the interaction log, not a state the system flags itself |
| items | array of `{ id, productId, quantity, unitPriceCents }` | embedded, not a separate object -- item `id`s are client-generated (`crypto.randomUUID()`) since Bird only assigns ids to top-level object records |
| lastActivityAt | datetime | |
| utmSource / utmCampaign / utmContent | string? | campaign attribution, folded into the first interaction comment if present |
| recommendationReason | string? | the Connectivity Builder's "why this plan" text |
| createdAt / updatedAt | datetime | |

### Order (Custom Object `orders`)
| field | type | notes |
|---|---|---|
| id | string, Bird-assigned | |
| cartId | string, **declared unique** | one order per cart |
| customerId | string | |
| status | enum: `pending`, `paid`, `failed` | `pending`/`failed` are new -- checkout is a saga, not a transaction, so an order can land in either mid-flight or after a compensated failure (see architecture.md) |
| subtotalCents / discountCents / totalCents | int | |
| voucherId | string? | |
| items | array, same shape as `Cart.items` | snapshot at checkout time |
| createdAt | datetime | |

### Voucher (Custom Object `vouchers`)
Scoped to a specific customer + product (not a cart -- a voucher survives
even if the customer starts a fresh setup).

| field | type | notes |
|---|---|---|
| id | string, Bird-assigned | |
| code | string, **declared unique** | e.g. `SAVE20-9F3K...` |
| customerId | string | |
| productId | string | which plan/add-on this discount applies to |
| percentOff | int | `20` for the primary flow |
| status | enum: `active`, `redeemed`, `expired` | |
| expiresAt | datetime | `createdAt + 30m` by default, agent-adjustable |
| issuedBy | enum: `agent` | always agent-issued, never automatic |
| resendCount | int, default 0 | incremented each time an agent extends/resends -- what "checked back the next day" looks like in the data |
| zendeskTicketId | string? | the ticket this was issued from |
| createdAt | datetime | |

### InteractionEvent (Bird Contact event)
The customer-behavior half of the activity log (the other half is agent
actions, which go straight to Zendesk comments without a local row -- see
[api-spec.md](api-spec.md)). Written/read via `trackEvent`/
`listEventsForContact` in `bird/client.ts`, not a Custom Object.

| field | type | notes |
|---|---|---|
| id | string, Bird-assigned | |
| customerId (contact id) | string | |
| type (event name) | string | e.g. `viewed_product`, `added_to_setup`, `removed_from_setup`, `answered_builder_step`, `tab_closed`, `returned_to_setup`, `activated` |
| detail | string, in `properties.detail` | human-readable, this is literally what gets posted as the Zendesk comment body |
| createdAt | datetime | |

### activity_tickets (Custom Object, new)
Exists solely so `GET /api/internal/tickets/:ticketId/customer` can
resolve a Zendesk ticket id back to a customer -- the Contacts API has no
confirmed way to search contacts by an arbitrary attribute like
`activeTicketId`. Written once whenever `identifyService` creates a new
activity ticket for a contact.

| field | type | notes |
|---|---|---|
| id | string, Bird-assigned | |
| ticketId | string, **declared unique** | the Zendesk ticket id |
| customerId | string | |
| createdAt | datetime | |

### SupportTicket (Custom Object `support_tickets`)
Unchanged in shape -- separate flow, see api-spec.md.

## Relationships

```
Customer 1──* Cart (items embedded) *──1 Product
Cart 1──? Order (items embedded)
Customer 1──* Voucher *──1 Product
Customer 1──* InteractionEvent
Customer 1──* SupportTicket   (separate flow -- see api-spec.md)
Customer 1──* activity_tickets   (ticket-id -> customer bridge)
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
