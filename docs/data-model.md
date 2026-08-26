# Data Model

Owned entirely by `apps/api` (Prisma). This is the intended shape — the
authoritative schema will live at `apps/api/prisma/schema.prisma`.

## Entities

### Customer
| field | type | notes |
|---|---|---|
| id | string (cuid) | |
| email | string, unique | only identity we need for a demo — no auth/password |
| name | string? | optional, collected at checkout |
| createdAt | datetime | |

### Product
| field | type | notes |
|---|---|---|
| id | string | |
| name | string | |
| description | string | |
| priceCents | int | store money as integer cents |
| imageUrl | string | |
| stock | int | decremented on order creation, not reserved on cart-add |

### Cart
| field | type | notes |
|---|---|---|
| id | string | also the value carried in the "return to your cart" email link |
| customerId | string? | nullable until checkout captures an email (guest cart) |
| status | enum: `active`, `abandoned`, `converted` | |
| lastActivityAt | datetime | bumped on every cart mutation; sweep job compares this |
| createdAt / updatedAt | datetime | |

### CartItem
| field | type | notes |
|---|---|---|
| id | string | |
| cartId | string | |
| productId | string | |
| quantity | int | |
| unitPriceCents | int | snapshot of price at add-time |

### Order
| field | type | notes |
|---|---|---|
| id | string | the "transaction" — this is what stands in for a real payment |
| cartId | string | |
| customerId | string | |
| status | enum: `paid` | demo only ever produces `paid`; no failure path modeled |
| subtotalCents | int | |
| discountCents | int | 0 unless a coupon was applied |
| totalCents | int | |
| couponId | string? | |
| createdAt | datetime | |

### OrderItem
Snapshot of `CartItem` rows at checkout time (same shape as `CartItem`, plus `orderId`).

### Coupon
| field | type | notes |
|---|---|---|
| id | string | |
| code | string, unique | human-enterable, e.g. `WELCOME20-9F3K` |
| cartId | string | scopes the coupon to the specific abandoned cart |
| percentOff | int | `20` for the primary flow |
| status | enum: `active`, `redeemed`, `expired` | |
| expiresAt | datetime | `createdAt + 15m` for the primary flow, configurable |
| issuedBy | enum: `agent`, `system` | who triggered issuance — always `agent` in the primary flow, since issuance is an explicit sidebar-app click |
| zendeskTicketId | string? | ticket the issuance was triggered from, if any |
| createdAt | datetime | |

### AbandonedCartEvent
Tracks the lifecycle of one abandonment, independent of the ticket/coupon
records so the sweep job and the sidebar app both have a single place to
read/write status.

| field | type | notes |
|---|---|---|
| id | string | |
| cartId | string | |
| detectedAt | datetime | when the sweep first flagged it |
| zendeskTicketId | string? | set once the ticket is created |
| status | enum: `detected`, `ticket_created`, `coupon_sent`, `recovered`, `expired_unused` | |

## Relationships

```
Customer 1──* Cart 1──* CartItem *──1 Product
Cart 1──* AbandonedCartEvent
Cart 1──? Coupon (0 or more, but only one `active` at a time)
Cart 1──? Order 1──* OrderItem
Order *──? Coupon
```

## Key invariants

- A `Cart` moves `active → abandoned → converted`, or `active → converted`
  directly on a normal checkout. It never goes backwards.
- A `Coupon` is only ever created via an explicit agent action in the sidebar
  app (or a demo/admin equivalent) — never automatically by the sweep job.
  The sweep job's job is to raise the ticket; issuing the discount is a human
  decision, which is the whole point of routing it through an agent.
- At most one `active` coupon per cart at a time.
- `Order.totalCents = subtotalCents - discountCents`, and `discountCents` is
  only non-zero when a `Coupon` with status `active` and `expiresAt > now` was
  applied at checkout — checked server-side, not trusted from the client.
