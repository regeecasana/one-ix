"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "../store/cartStore";
import { Button } from "./Button";

// Fires exactly 30 seconds after the visitor lands, once, as long as no
// identity has been captured yet. Submitting creates the customer's
// activity ticket in Zendesk and flushes every interaction logged so far.
export function EmailPopup() {
  const customerId = useCartStore((s) => s.customerId);
  const emailPromptDismissed = useCartStore((s) => s.emailPromptDismissed);
  const identify = useCartStore((s) => s.identify);
  const dismissEmailPrompt = useCartStore((s) => s.dismissEmailPrompt);

  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId || emailPromptDismissed) return;
    const timer = window.setTimeout(() => {
      if (!useCartStore.getState().customerId && !useCartStore.getState().emailPromptDismissed) {
        setVisible(true);
      }
    }, 30_000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (customerId || emailPromptDismissed || !visible) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await identify(email.trim(), name.trim() || undefined);
      setVisible(false);
    } catch {
      setError("Couldn't save that. Check your email and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDismiss() {
    dismissEmailPrompt();
    setVisible(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 pb-4 sm:items-center sm:pb-0">
      <div className="card-shadow relative w-full max-w-sm rounded-2xl bg-white p-6">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute right-4 top-4 font-display text-lg text-ink-soft hover:text-ink"
        >
          ×
        </button>
        <span className="eyebrow text-blaze">Stay in the loop</span>
        <h2 className="mt-2 font-display text-xl font-bold text-ink">What's your email?</h2>
        <p className="mt-1 font-body text-sm text-ink-soft">
          We'll keep your setup saved and send you a hand if you get stuck -- no spam, just your connection.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-xl border border-hairline bg-white px-4 py-2.5 font-body text-ink outline-none focus-visible:border-blaze"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className="rounded-xl border border-hairline bg-white px-4 py-2.5 font-body text-ink outline-none focus-visible:border-blaze"
          />
          {error && <p className="font-body text-sm text-pink">{error}</p>}
          <Button type="submit" disabled={submitting || !email.trim()} className="w-full">
            {submitting ? "Saving…" : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
