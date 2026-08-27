# Data Model

Owned entirely by `apps/api` (Prisma). This is the intended shape — the
authoritative schema lives at `apps/api/prisma/schema.prisma`.

The core entities are unchanged in shape from the earlier e-commerce
version — `Cart`/`CartItem`/`Order`/`OrderItem` still mean "a set of items,
saved, then paid" underneath. What changed: `Coupon` and
`AbandonedCartEvent` are gone (nothing in this story is a discount code
anymore, and CDP nudges don't create tickets), `Customer` gained an XL
Points ledger and a mobile number, `Cart` gained campaign attribution and
recommendation fields, and a new `SupportTicket` model tracks the
proactive-contact flow.

## Entities

### Customer
| field | type | notes |
|---|---|---|
| id | string (cuid) | |
| email | string, unique | primary identity key |
| name | string? | optional |
| mobileNumber | string?, unique | captured + OTP-verified at "save my setup" |
| pointsBalance | int, default 0 | XL Points ledger — a running balance, not a full transaction log |
| createdAt | datetime | |

### Product
Unchanged — reseeded as connectivity plans and add-ons (see
[api-spec.md](api-spec.md)). `priceCents`/`stock` still apply; "stock" reads
oddly for a plan but keeping one field set avoids a parallel schema for
what's still structurally "a thing with a price you can add to a cart."

### Cart
The in-progress **setup** — same table, telco framing.

| field | type | notes |
|---|---|---|
| id | string | also the value carried in the "continue my setup" email link |
| customerId | string? | nullable until OTP verification resolves identity |
| status | enum: `active`, `abandoned`, `converted` | |
| lastActivityAt | datetime | bumped on every mutation; CDP sweep compares this |
| remindedAt | datetime? | set once the CDP nudge email is sent — the sweep only sends once per cart |
| utmSource / utmCampaign / utmContent | string? | campaign attribution captured from the landing page's query params at cart creation |
| recommendationReason | string? | the Connectivity Builder's plain-language "why this plan" text, saved so the Unified Profile can show it later |
| createdAt / updatedAt | datetime | |

### CartItem / Order / OrderItem
Unchanged in shape. `Order` still has no `couponId` field — it never had a
discount concept beyond points, and points are tracked on `Customer`, not
on the order.

### SupportTicket
The proactive-contact flow (Act 2). Independent of `Cart` — a support
contact isn't necessarily related to any specific setup.

| field | type | notes |
|---|---|---|
| id | string | |
| customerId | string | resolved (found-or-created) by email at submission time |
| zendeskTicketId | string? | null if Zendesk isn't configured — see [api-spec.md](api-spec.md) |
| subject | string | |
| message | string | |
| createdAt | datetime | |

## Relationships

```
Customer 1──* Cart 1──* CartItem *──1 Product
Cart 1──? Order 1──* OrderItem
Customer 1──* SupportTicket
```

## Key invariants

- A `Cart` moves `active → abandoned → converted`, or `active → converted`
  directly on immediate activation. It never goes backwards.
- Points are only ever granted by explicit, named events, never silently:
  +5,000 on OTP verification (identity resolution), +5,000 more on
  activation *if* `Cart.remindedAt` is set (i.e. this activation followed a
  CDP nudge), and any amount an agent grants as goodwill from the sidebar
  app. `Customer.pointsBalance` is the sum of all of these — no separate
  ledger table in this build, so points can't be un-granted, only added to.
- The CDP sweep sends the nudge **at most once** per cart
  (`remindedAt IS NULL` is part of its query) — it doesn't re-notify.
- A `SupportTicket` is created by an inbound contact, never by the CDP
  sweep — the two flows are independent. Act 1 (nudge) never produces a
  Zendesk ticket; Act 2 (support contact) always does (when Zendesk is
  configured).
