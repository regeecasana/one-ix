# Build Roadmap

Phased so there's a demoable slice at the end of each phase. Rewritten
again when the demo moved from the OTP/points story to the interaction-
logging/voucher story -- see [user-stories.md](user-stories.md) for why.

## Phase 0 -- Scaffolding

Monorepo structure, docs. Done.

## Phase 1 -- Catalog + activation happy path

- `api`: products, carts ("setup"), checkout/complete ("activation").
- `storefront`: catalog, product detail, setup, activation UI.
- Demoable: browse plans -> build a setup -> activate -> confirmation email.

## Phase 2 -- Connectivity Builder + email identification

- `api`: `POST /api/builder/recommend` (3-input rules engine), `POST
  /api/identify` (find-or-create by email, creates the per-customer
  ticket on first identification, flushes buffered pre-identification
  events).
- `storefront`: the 3-step builder matching the brief's mockups, the
  30-second email popup, campaign-attribution capture.
- Demoable: answer the builder -> get one recommended plan with a reason
  -> 30 seconds in, the email popup appears -> submit -> a ticket exists.

## Phase 3 -- Live interaction logging

- `api`: `POST /api/customers/:id/interactions`, mirrored to the active
  ticket as a comment.
- `storefront`: instrumented at every touchpoint named in
  [user-stories.md](user-stories.md) (view plan, add to setup, answer a
  builder step, tab-close best-effort, return to setup, activate).
- Demoable: perform a few actions on the storefront, watch them appear as
  ticket comments in order.

## Phase 4 -- Voucher recovery + sidebar app

- `api`: voucher issue/resend endpoints, voucher validation at checkout,
  close-ticket endpoint.
- `zendesk-app`: profile view, issue/resend voucher, close ticket -- still
  a scaffold, not yet built.
- `storefront`: voucher application at checkout.
- Demoable today via the API standing in for the sidebar app; full
  end-to-end demo needs `zendesk-app` too.

## Phase 5 -- Deploy to hosting

MongoDB Atlas + Vercel (one project) + a Zendesk trial instance. See
[hosting.md](hosting.md). Done -- live at the Vercel production URL.

## Explicitly out of scope

- Real payment processing.
- Real phone/OTP verification -- identity is email-only in this build.
- Any automated abandonment detection -- recognizing the pattern in the
  interaction log is the agent's job, not a background job's.
- Production-grade job queue -- there's no background job in this build
  at all.
- Multi-tenant Zendesk support -- one instance, one internal token.
