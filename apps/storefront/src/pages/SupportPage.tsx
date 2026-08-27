import { useState } from "react";
import { Link } from "react-router-dom";
import { submitSupportTicket } from "../lib/api";
import { Button } from "../components/Button";

export function SupportPage() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submitSupportTicket({ email: email.trim(), subject: subject.trim(), message: message.trim() });
      setSubmitted(true);
    } catch {
      setError("Couldn't send that. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-3xl font-bold uppercase text-ink">Message sent</h1>
        <p className="font-body text-ink-soft">
          We've got it -- an agent will pick this up shortly, with your account already in view.
        </p>
        <Link to="/" className="font-mono text-sm uppercase tracking-[0.08em] text-blaze underline underline-offset-4">
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-ink">Contact support</h1>
        <p className="mt-2 font-body text-sm text-ink-soft">
          Tell us what's going on. Whoever picks this up will already see your account -- no need to explain who you
          are.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-ink bg-canvas px-3 py-2 font-body text-ink outline-none focus-visible:outline-2 focus-visible:outline-blaze"
            placeholder="ravta@example.com"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">Subject</span>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border border-ink bg-canvas px-3 py-2 font-body text-ink outline-none focus-visible:outline-2 focus-visible:outline-blaze"
            placeholder="Network issues before my livestream"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">Message</span>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border border-ink bg-canvas px-3 py-2 font-body text-ink outline-none focus-visible:outline-2 focus-visible:outline-blaze"
            placeholder="What's going on?"
          />
        </label>

        {error && <p className="font-body text-sm text-blaze">{error}</p>}

        <div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send message"}
          </Button>
        </div>
      </form>
    </div>
  );
}
