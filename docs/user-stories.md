# User Stories / Demo Script

Two personas: the **Consumer** (shopper) and the **Agent** (Zendesk support
agent). The primary story is one flow told from both sides — the rest are
supporting scenarios the demo should also be able to show.

## Primary flow (the headline demo)

### Consumer side

1. Consumer browses the storefront, adds an item to their cart.
2. Consumer starts checkout, then abandons — closes the tab, or balks at the
   price. No order is created.
3. Some time later (minutes in the demo, framed as "minutes or hours" in
   reality), the consumer gets an email: **"You just got a 20% off coupon —
   use it on [item]."**
4. Consumer clicks the email, lands back on the storefront with their cart
   restored and the coupon available.
5. Consumer checks out using the coupon. A real `Order` is created at the
   discounted price (no real payment).

### Agent side

1. A new Zendesk ticket appears: **"Abandoned cart — [item]"**, auto-created
   by the system, with the consumer as requester and the item/cart details in
   the ticket body.
2. Agent opens the ticket. The custom sidebar app shows the cart contents,
   the consumer's email, and whether a coupon has already been issued for
   this cart.
3. Agent decides to help and clicks **"Send 20% coupon"** in the sidebar app.
4. The system generates a coupon (20% off, tied to that cart/item), emails it
   to the consumer, and marks it **expires in 15 minutes**. The sidebar app
   and the ticket both reflect that a coupon was sent, by whom, and when it
   expires.
5. If the consumer redeems it, the ticket (or the sidebar app view) reflects
   the recovered order. If it expires unused, the sidebar shows "expired."

These two are **one flow**, not two separate features: step 4 on the agent
side is what causes step 3 on the consumer side.

## Supporting scenarios to also capture

- **Happy path, no abandonment.** Consumer adds to cart, checks out
  immediately, no coupon involved, no ticket created. This has to keep
  working — it's the baseline the recovery flow is an exception to.
- **Coupon expires unused.** Agent sends the coupon, 15 minutes pass, consumer
  never returns. Coupon flips to `expired`; cart stays `abandoned`; the
  sidebar app shows the expiry instead of an active-coupon state.
- **Consumer returns after expiry.** Coupon code no longer applies at
  checkout; consumer can still buy at full price. Demonstrates the coupon
  isn't a permanent backdoor.
- **Multiple items in the abandoned cart.** Ticket/sidebar should summarize
  more than a single-item cart, and the coupon should apply across the cart
  rather than one SKU.
- **No coupon available / agent declines.** Agent can view the ticket without
  issuing a coupon (e.g. item is final-sale or already discounted) — issuing
  a coupon is always an explicit agent action, never automatic.
- **Duplicate abandonment.** Same consumer abandons a cart again after
  already recovering (or ignoring) a previous one — a second, independent
  ticket/coupon cycle, not a merge into the old one.
- **Agent-initiated, ticket-less flow (stretch).** Agent proactively looks up
  a customer/cart and issues a coupon without a system-generated ticket
  (e.g. responding to a general "is there a discount?" ticket). Confirms
  coupon issuance isn't hard-wired to the auto-created ticket type.

## Demo pacing note

Real abandonment windows and "few minutes or hours" timelines don't fit a
live demo. The abandoned-cart threshold, sweep interval, and coupon TTL are
all configurable (see [demo-setup.md](demo-setup.md)), and there's a
demo-only "force sweep now" control so the story above can be told in a
couple of minutes without arbitrary waiting.
