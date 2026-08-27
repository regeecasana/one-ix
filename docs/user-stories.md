# User Stories / Demo Script

Persona: **Ravta**, an XLSmart customer -- a digital creator, part of a
multi-brand household. Two sides of the demo: Ravta herself, and the
**support agent** who watches her activity and steps in.

This replaces the previous OTP/points-based script. The mechanics changed
again: identity is now just an email address (captured by a timed popup,
no phone/OTP), every meaningful interaction is logged live to a Zendesk
ticket as it happens, and recovery is a time-limited **voucher** an agent
sends by hand -- not an automated points-bonus email.

## The flow

1. Ravta lands on the XLSmart site. The **Connectivity Builder** walks her
   through three quick questions -- what she uses her connection for
   (multi-select), how many devices need coverage, what matters most to
   her -- and recommends **one** plan with a plain-language reason, not a
   generic list.
2. **30 seconds** after she first arrives (regardless of what she's done),
   a popup asks for her email. The moment she submits it:
   - `api` resolves (or creates) her `Customer` record by email.
   - A Zendesk ticket is created for her -- this is now her running
     activity log, not a "something went wrong" ticket.
   - Anything she did in those first 30 seconds (viewed a plan, answered a
     builder question) gets flushed to the ticket as catch-up comments, so
     the agent sees the whole session from the start.
3. From this point on, **every meaningful interaction is posted to the
   ticket as a comment, live**: "Ravta viewed GoSurf799", "Ravta added
   GoSurf799 to her setup", "Ravta answered: uses connection for
   Livestreaming, Uploading Content", "Ravta closed the tab" (best-effort
   -- see below), "Ravta returned to her setup", "Ravta activated".
4. Ravta adds a plan to her setup ("Save My Setup" -- this is the
   add-to-cart equivalent) but closes the tab before activating.
5. The agent, watching the ticket, reads the comment trail and recognizes
   the pattern: added to setup, then went quiet. They open the sidebar
   app, see the plan she was looking at, and check whether a voucher
   applies to it.
6. The agent sends a **20% voucher**, scoped to that plan, **expiring in
   30 minutes** -- one click from the sidebar app. This emails Ravta the
   code and posts a ticket comment recording it.
7. If Ravta returns and activates with the voucher before it expires: the
   ticket logs "Ravta activated with voucher SAVE20-XXXX applied," and the
   agent closes the ticket. Happy ending.
8. If Ravta ignores the email and the voucher expires: the next day, the
   agent reopens the ticket, sends a **new voucher with an extended
   lifespan**, and waits again. (In the demo, "the next day" is just the
   agent clicking "resend" again -- see [demo-setup.md](demo-setup.md) for
   how real time gets compressed.)
9. If she ignores the second one too, the agent closes the ticket
   unresolved.

## Supporting scenarios to also capture

- **Happy path, no voucher needed.** Ravta finishes the builder and clicks
  "Activate Now" directly -- no setup-saving detour, no voucher. The
  interaction log still shows the full builder-answer trail leading up to
  it.
- **Multiple interactions before email capture.** Ravta looks at two
  different plans in her first 30 seconds; both show up as catch-up
  comments once she submits her email, in the order they happened.
- **Voucher expires unused, no next-day follow-up given.** Agent can just
  close the ticket -- sending a follow-up is always an explicit choice,
  never automatic.
- **Voucher applied after expiry.** Checkout rejects it server-side (not
  just hidden client-side) -- Ravta can still activate at full price.
- **Tab-close detection is best-effort.** It relies on the browser's
  `visibilitychange`/`pagehide` events, which aren't 100% reliable (killed
  tabs, mobile app-switches). When it doesn't fire, the log simply stops --
  which is itself a legible signal to the agent ("went quiet after adding
  to setup"), even without an explicit close event.

## Demo pacing note

The 30-second popup delay and voucher TTL are both short by design so the
whole loop is watchable live. See [demo-setup.md](demo-setup.md) for the
env vars and the internal endpoint that lets an agent simulate "checking
back the next day" without an actual day passing.
