# User Stories / Demo Script

Persona: **Ravta**, an XLSmart customer — a digital creator, part of a
multi-brand household. Two sides of the demo: Ravta herself, and the
**support agent** who eventually helps her.

This replaced an earlier, simpler abandoned-cart-and-coupon script. That
mechanic still exists underneath (a saved-but-not-activated setup is still
detected and nudged the same way a cart was), but the story is now telco-
specific and has a second, independent act: a proactive support contact.

## Act 1 — Acquisition, the Connectivity Builder, and the CDP nudge

1. Ravta is scrolling TikTok and sees an XL **Creator Package** campaign ad.
   She clicks the CTA.
2. She lands on the Creator Package landing page. The page already knows
   *why* she's there — source = TikTok, campaign = Creator Package, content
   context = creator use case — captured from the link's query params, not
   asked again.
3. She works through the **Connectivity Builder**: a couple of quick
   questions (how she uses her connection, how many devices need coverage).
   The page recommends **one specific plan**, with a plain-language reason
   tied to her answers — not a generic plan list.
4. She clicks **"Save my setup."** The page asks for her mobile number,
   consent, and an OTP — in exchange for **5,000 XL Points**.
   - Before the OTP, all we have is an anonymous session: her builder
     answers and browsing signals, no identity yet.
   - The OTP verifies the mobile number and triggers **identity
     resolution** — matching (or creating) a `Customer` record, merging the
     anonymous signals into it. Anonymous behavior + known customer record
     = one **Unified Profile**.
5. Ravta doesn't activate right away. She saves the setup and decides to
   think about it later. No `Order` is created.
6. An hour later (minutes, in the demo), the CDP sweep notices: setup
   saved, no purchase, time elapsed — high intent, not yet converted. It
   sends a personalized reminder by email:
   > "Hi Ravta 👋 Your Creator Setup is still saved. Complete your
   > activation today and receive another 5,000 XL points."
   > **Continue My Setup**
7. Ravta clicks through, her setup is right where she left it, and she
   activates. A real `Order` is created (mock payment), and because this
   activation followed a CDP nudge, she gets the completion bonus —
   10,000 XL Points total for this setup.

## Act 2 — A support contact, and what the agent sees

1. Later, before an important livestream, Ravta hits a network issue and
   emails support. This is **unrelated** to the setup/activation above —
   she's not asking about a discount, she has a problem *right now*.
2. That email becomes a Zendesk ticket. Instead of the agent having to ask
   "what's your account number," the ticket sidebar app immediately shows
   Ravta's **Unified Profile**: which campaign brought her in, her saved
   setup and recommended plan, her activation history, her current XL
   Points balance, and any prior support contacts.
3. There's no automated diagnosis step in this build — the ticket goes
   straight to a human agent, who already has full context the moment they
   open it.
4. If the agent resolves the issue and wants to make it right, they can
   grant **goodwill points** from the sidebar app in one click — the same
   "single agent action" beat the coupon button used to be, just pointed at
   a different, more natural moment (compensating a real problem, not
   nudging a sale).
5. During her livestream, Ravta mentions the smooth resolution — the loop
   closes back to the TikTok audience that brought her in. (Narrative only;
   nothing to build for this beat.)

## Supporting scenarios to also capture

- **Happy path, no nudge needed.** Ravta builds a setup and activates
  immediately. No CDP email, no points bonus beyond the initial 5,000.
- **Nudge sent, never returns.** The CDP sweep sends the reminder once
  (`Cart.remindedAt` set) and doesn't re-send. Setup stays saved,
  un-activated, indefinitely — no expiry pressure the way the old coupon
  had one, since points aren't time-limited.
- **Multi-item setup.** A plan plus an add-on (e.g. a 5G speed boost) —
  the Unified Profile and the nudge email both need to summarize more than
  one line item.
- **Support contact with no prior setup.** Someone can email support
  without ever having gone through the builder — identity resolution still
  finds or creates a `Customer` by email, the profile is just thinner.
- **Agent declines to grant points.** Viewing the ticket and its context is
  independent of granting points — that's always an explicit, optional
  agent action, never automatic.
- **Duplicate support contact.** The same customer emails again later — a
  second, independent `SupportTicket`, not merged into the first.

## Demo pacing note

Same idea as before: the CDP threshold and sweep interval are
env-configurable, and there's a demo-only "force sweep now" endpoint so Act
1 doesn't require an actual hour's wait. See [demo-setup.md](demo-setup.md).
