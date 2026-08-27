import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateCoupon, type CouponValidation, ApiError } from "../lib/api";
import { formatCents } from "../lib/money";
import { useCartStore } from "../store/cartStore";
import { Button } from "../components/Button";

const REASON_COPY: Record<string, string> = {
  not_found: "That code doesn't apply to this cart.",
  expired: "That code has expired.",
  redeemed: "That code has already been used.",
};

export function CheckoutPage() {
  const cart = useCartStore((s) => s.cart);
  const loading = useCartStore((s) => s.loading);
  const refresh = useCartStore((s) => s.refresh);
  const startCheckout = useCartStore((s) => s.startCheckout);
  const completeCheckout = useCartStore((s) => s.completeCheckout);
  const pendingCoupon = useCartStore((s) => s.pendingCoupon);
  const clearPendingCoupon = useCartStore((s) => s.clearPendingCoupon);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [startError, setStartError] = useState<string | null>(null);
  const [startingCheckout, setStartingCheckout] = useState(false);

  const [couponCode, setCouponCode] = useState(pendingCoupon ?? "");
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && (!cart || cart.items.length === 0)) {
      navigate("/cart", { replace: true });
    }
  }, [loading, cart, navigate]);

  useEffect(() => {
    if (pendingCoupon && cart?.customerId) {
      void applyCoupon(pendingCoupon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.customerId]);

  if (!cart) {
    return <p className="font-mono text-sm text-ink-soft">Loading activation…</p>;
  }

  const subtotalCents = cart.items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  const discountCents =
    couponResult?.valid && couponResult.coupon
      ? Math.round((subtotalCents * couponResult.coupon.percentOff) / 100)
      : 0;
  const totalCents = subtotalCents - discountCents;

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setStartError(null);
    setStartingCheckout(true);
    try {
      await startCheckout(email.trim(), name.trim() || undefined);
    } catch {
      setStartError("Couldn't start activation. Check the email and try again.");
    } finally {
      setStartingCheckout(false);
    }
  }

  async function applyCoupon(code: string) {
    if (!cart || !code.trim()) return;
    setCheckingCoupon(true);
    try {
      const result = await validateCoupon(code.trim(), cart.id);
      setCouponResult(result);
    } catch {
      setCouponResult({ valid: false, reason: "not_found" });
    } finally {
      setCheckingCoupon(false);
      clearPendingCoupon();
    }
  }

  async function handlePlaceOrder() {
    setOrderError(null);
    setPlacingOrder(true);
    try {
      await completeCheckout(couponResult?.valid ? couponCode.trim() : undefined);
      navigate("/order/confirmation");
    } catch (err) {
      setOrderError(
        err instanceof ApiError && err.message === "invalid_coupon"
          ? "That code no longer applies -- remove it and try again."
          : "Couldn't complete activation. Try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-bold uppercase text-ink">Activate</h1>

      <section className="flex flex-col gap-3 border border-hairline bg-canvas p-5">
        <h2 className="eyebrow">Who's activating?</h2>
        {cart.customerId ? (
          <p className="font-body text-sm text-ink">
            Confirmation goes to <span className="font-mono">{email || "your email"}</span>.
          </p>
        ) : (
          <form onSubmit={handleStart} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-ink bg-canvas px-3 py-2 font-body text-ink outline-none focus-visible:outline-2 focus-visible:outline-blaze"
                placeholder="you@example.com"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">Name (optional)</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-ink bg-canvas px-3 py-2 font-body text-ink outline-none focus-visible:outline-2 focus-visible:outline-blaze"
                placeholder="Jamie Rivera"
              />
            </label>
            <Button type="submit" disabled={startingCheckout}>
              {startingCheckout ? "Starting…" : "Continue"}
            </Button>
          </form>
        )}
        {startError && <p className="font-body text-sm text-blaze">{startError}</p>}
      </section>

      {cart.customerId && (
        <>
          <section className="flex flex-col gap-3 border border-hairline bg-canvas p-5">
            <h2 className="eyebrow">Got a promo code?</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponResult(null);
                }}
                className="flex-1 border border-ink bg-canvas px-3 py-2 font-mono uppercase text-ink outline-none focus-visible:outline-2 focus-visible:outline-blaze"
                placeholder="SAVE20-XXXXXXXXXXXX"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => applyCoupon(couponCode)}
                disabled={checkingCoupon || !couponCode.trim()}
              >
                {checkingCoupon ? "Checking…" : "Apply"}
              </Button>
            </div>
            {couponResult && !couponResult.valid && (
              <p className="font-body text-sm text-blaze">
                {REASON_COPY[couponResult.reason ?? "not_found"] ?? "That code doesn't work."}
              </p>
            )}
            {couponResult?.valid && couponResult.coupon && (
              <p className="font-body text-sm text-moss">
                Applied -- {couponResult.coupon.percentOff}% off this order.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-2 border-t border-ink pt-4">
            <div className="flex justify-between font-mono text-sm tabular-nums text-ink-soft">
              <span>Subtotal</span>
              <span>{formatCents(subtotalCents)}</span>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between font-mono text-sm tabular-nums text-moss">
                <span>Discount</span>
                <span>−{formatCents(discountCents)}</span>
              </div>
            )}
            <div className="flex justify-between font-mono text-xl tabular-nums text-ink">
              <span>Total</span>
              <span>{formatCents(totalCents)}</span>
            </div>

            {orderError && <p className="font-body text-sm text-blaze">{orderError}</p>}

            <div className="flex justify-end pt-2">
              <Button onClick={handlePlaceOrder} disabled={placingOrder}>
                {placingOrder ? "Activating…" : "Confirm activation"}
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
