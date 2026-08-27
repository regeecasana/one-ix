import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { formatCents } from "../lib/money";
import { useCartStore } from "../store/cartStore";
import { Button } from "../components/Button";
import { ApiError } from "../lib/api";

export function SetupPage() {
  const cart = useCartStore((s) => s.cart);
  const loading = useCartStore((s) => s.loading);
  const refresh = useCartStore((s) => s.refresh);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const requestOtp = useCartStore((s) => s.requestOtp);
  const verifyOtp = useCartStore((s) => s.verifyOtp);
  const completeActivation = useCartStore((s) => s.completeActivation);
  const { products } = useProducts();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pointsJustEarned, setPointsJustEarned] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const subtotalCents = (cart?.items ?? []).reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);

  if (loading && !cart) {
    return <p className="font-mono text-sm text-ink-soft">Loading your setup…</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-3xl font-bold uppercase text-ink">My Setup</h1>
        <p className="font-body text-ink-soft">Your setup is empty.</p>
        <Link to="/builder" className="font-mono text-sm uppercase tracking-[0.08em] text-blaze underline underline-offset-4">
          Build my setup
        </Link>
      </div>
    );
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSendingOtp(true);
    try {
      await requestOtp(mobileNumber.trim());
      setOtpSent(true);
    } catch {
      setSaveError("Couldn't send a code. Check the number and try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setVerifying(true);
    try {
      await verifyOtp({ email: email.trim(), mobileNumber: mobileNumber.trim(), otp: otp.trim(), name: name.trim() || undefined });
      setPointsJustEarned(true);
    } catch (err) {
      setSaveError(
        err instanceof ApiError && err.message === "invalid_otp"
          ? "That code doesn't match. Try again."
          : "Couldn't verify. Try again."
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleActivate() {
    setActivateError(null);
    setActivating(true);
    try {
      await completeActivation();
      navigate("/activated");
    } catch {
      setActivateError("Couldn't complete activation. Try again.");
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-bold uppercase text-ink">My Setup</h1>

      <div className="flex flex-col border-t border-ink">
        <div className="hidden border-b border-ink py-2 font-mono text-xs uppercase tracking-[0.1em] text-ink-soft sm:flex">
          <span className="flex-1">Item</span>
          <span className="w-28 text-right">Qty</span>
          <span className="w-20 text-right">Unit</span>
          <span className="w-20 text-right">Total</span>
          <span className="w-16" />
        </div>

        {cart.items.map((item) => {
          const product = productMap.get(item.productId);
          return (
            <div key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline py-3">
              <span className="w-full font-body text-ink sm:w-auto sm:flex-1">{product?.name ?? item.productId}</span>
              <div className="inline-flex items-center border border-ink sm:w-28 sm:justify-center">
                <button
                  type="button"
                  onClick={() =>
                    item.quantity - 1 <= 0 ? removeItem(item.id) : addItem(item.productId, item.quantity - 1)
                  }
                  className="px-2 py-1 font-mono text-ink hover:bg-ink hover:text-canvas"
                  aria-label={`Decrease quantity of ${product?.name ?? "item"}`}
                >
                  −
                </button>
                <span className="w-8 text-center font-mono tabular-nums text-ink">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => addItem(item.productId, item.quantity + 1)}
                  className="px-2 py-1 font-mono text-ink hover:bg-ink hover:text-canvas"
                  aria-label={`Increase quantity of ${product?.name ?? "item"}`}
                >
                  +
                </button>
              </div>
              <span className="font-mono text-sm tabular-nums text-ink-soft sm:w-20 sm:text-right sm:text-base sm:text-ink">
                {formatCents(item.unitPriceCents)}
              </span>
              <span className="font-mono tabular-nums text-ink sm:w-20 sm:text-right">
                {formatCents(item.unitPriceCents * item.quantity)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft underline underline-offset-4 hover:text-blaze sm:w-16 sm:text-right"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-ink pt-4">
        <span className="eyebrow">Subtotal / mo</span>
        <span className="font-mono text-xl tabular-nums text-ink">{formatCents(subtotalCents)}</span>
      </div>

      {!cart.customerId && (
        <section className="flex flex-col gap-3 border border-hairline bg-canvas p-5">
          <h2 className="eyebrow">Save my setup</h2>
          <p className="font-body text-sm text-ink-soft">
            Verify your number and get 5,000 XL points -- come back and finish activating whenever you're ready.
          </p>

          {!otpSent ? (
            <form onSubmit={handleSendCode} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
              <label className="flex flex-col gap-1 sm:flex-1 sm:basis-48">
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
              <label className="flex flex-col gap-1 sm:flex-1 sm:basis-48">
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">Mobile number</span>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="border border-ink bg-canvas px-3 py-2 font-body text-ink outline-none focus-visible:outline-2 focus-visible:outline-blaze"
                  placeholder="+62 812 3456 7890"
                />
              </label>
              <label className="flex flex-col gap-1 sm:flex-1 sm:basis-48">
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">Name (optional)</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-ink bg-canvas px-3 py-2 font-body text-ink outline-none focus-visible:outline-2 focus-visible:outline-blaze"
                  placeholder="Ravta"
                />
              </label>
              <Button type="submit" disabled={sendingOtp || !email.trim() || !mobileNumber.trim()}>
                {sendingOtp ? "Sending…" : "Send code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <p className="w-full font-body text-sm text-ink">
                Code sent to <span className="font-mono">{mobileNumber}</span>.
              </p>
              <label className="flex flex-col gap-1 sm:flex-1">
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">6-digit code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="border border-ink bg-canvas px-3 py-2 font-mono text-ink outline-none focus-visible:outline-2 focus-visible:outline-blaze"
                  placeholder="000000"
                />
              </label>
              <Button type="submit" disabled={verifying || !otp.trim()}>
                {verifying ? "Verifying…" : "Verify & save"}
              </Button>
            </form>
          )}

          {saveError && <p className="font-body text-sm text-blaze">{saveError}</p>}
        </section>
      )}

      {cart.customerId && (
        <section className="flex flex-col gap-3 border border-hairline bg-canvas p-5">
          {pointsJustEarned && (
            <p className="font-mono text-sm text-moss">+5,000 XL points earned. Your setup is saved.</p>
          )}
          <h2 className="eyebrow">Ready to activate</h2>
          <div className="flex items-center justify-between font-mono text-xl tabular-nums text-ink">
            <span>Total / mo</span>
            <span>{formatCents(subtotalCents)}</span>
          </div>
          {activateError && <p className="font-body text-sm text-blaze">{activateError}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleActivate} disabled={activating}>
              {activating ? "Activating…" : "Activate now"}
            </Button>
            <span className="font-body text-sm text-ink-soft">
              or come back later -- we'll remind you if you don't.
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
