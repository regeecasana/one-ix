"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Voucher } from "@oneix/shared";
import { useProducts } from "@/hooks/useProducts";
import { formatCents } from "@/lib/money";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/Button";
import { validateVoucher } from "@/lib/api";

export function SetupContent() {
  const cart = useCartStore((s) => s.cart);
  const loading = useCartStore((s) => s.loading);
  const refresh = useCartStore((s) => s.refresh);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const identify = useCartStore((s) => s.identify);
  const completeActivation = useCartStore((s) => s.completeActivation);
  const { products } = useProducts();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);

  const [voucherCode, setVoucherCode] = useState(searchParams.get("voucher") ?? "");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);

  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  const autoActivated = useRef(false);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const subtotalCents = (cart?.items ?? []).reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  const discountCents = appliedVoucher ? Math.round((subtotalCents * appliedVoucher.percentOff) / 100) : 0;

  async function handleCheckVoucher(code: string) {
    if (!cart?.customerId || !code.trim()) return;
    setCheckingVoucher(true);
    setVoucherError(null);
    setAppliedVoucher(null);
    try {
      let firstReason: string | undefined;
      for (const item of cart.items) {
        const result = await validateVoucher(code.trim().toUpperCase(), cart.customerId, item.productId);
        if (result.valid && result.voucher) {
          setAppliedVoucher(result.voucher);
          setCheckingVoucher(false);
          return;
        }
        firstReason ??= result.reason;
      }
      setVoucherError(
        firstReason === "expired" ? "That voucher has expired." : firstReason === "redeemed" ? "That voucher was already used." : "That voucher code isn't valid for this setup."
      );
    } finally {
      setCheckingVoucher(false);
    }
  }

  useEffect(() => {
    const code = searchParams.get("voucher");
    if (code && cart?.customerId) handleCheckVoucher(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.customerId]);

  async function handleIdentify(e: React.FormEvent) {
    e.preventDefault();
    setIdentifyError(null);
    setIdentifying(true);
    try {
      await identify(email.trim(), name.trim() || undefined);
      await refresh();
    } catch {
      setIdentifyError("Couldn't save that. Check your email and try again.");
    } finally {
      setIdentifying(false);
    }
  }

  async function handleActivate() {
    setActivateError(null);
    setActivating(true);
    try {
      await completeActivation(appliedVoucher?.code);
      router.push("/activated");
    } catch {
      setActivateError("Couldn't complete activation. Try again.");
    } finally {
      setActivating(false);
    }
  }

  useEffect(() => {
    if (autoActivated.current) return;
    if (searchParams.get("activate") === "1" && cart?.customerId && cart.items.length > 0 && !activating) {
      autoActivated.current = true;
      handleActivate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.customerId, cart?.items.length]);

  if (loading && !cart) {
    return <p className="font-mono text-sm text-ink-soft">Loading your setup…</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">My Setup</h1>
        <p className="font-body text-ink-soft">Your setup is empty.</p>
        <Link href="/builder" className="font-display text-sm font-semibold text-blaze underline underline-offset-4">
          Build my setup
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">My Setup</h1>

      <div className="flex flex-col gap-3">
        {cart.items.map((item) => {
          const product = productMap.get(item.productId);
          return (
            <div key={item.id} className="card-shadow flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-hairline bg-white p-4">
              <span className="w-full font-display font-semibold text-ink sm:w-auto sm:flex-1">
                {product?.name ?? item.productId}
              </span>
              <div className="inline-flex items-center rounded-full border border-hairline">
                <button
                  type="button"
                  onClick={() =>
                    item.quantity - 1 <= 0 ? removeItem(item.id) : addItem(item.productId, item.quantity - 1)
                  }
                  className="px-3 py-1 font-display text-ink hover:text-blaze"
                  aria-label={`Decrease quantity of ${product?.name ?? "item"}`}
                >
                  −
                </button>
                <span className="w-8 text-center font-display tabular-nums text-ink">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => addItem(item.productId, item.quantity + 1)}
                  className="px-3 py-1 font-display text-ink hover:text-blaze"
                  aria-label={`Increase quantity of ${product?.name ?? "item"}`}
                >
                  +
                </button>
              </div>
              <span className="font-display tabular-nums text-ink sm:w-24 sm:text-right">
                {formatCents(item.unitPriceCents * item.quantity)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="font-display text-xs font-semibold text-ink-soft underline underline-offset-4 hover:text-pink sm:w-16 sm:text-right"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1 rounded-2xl bg-lavender p-5">
        <div className="flex items-center justify-between font-body text-sm text-ink-soft">
          <span>Subtotal / mo</span>
          <span className="tabular-nums">{formatCents(subtotalCents)}</span>
        </div>
        {appliedVoucher && (
          <div className="flex items-center justify-between font-body text-sm text-moss">
            <span>Voucher {appliedVoucher.code} (-{appliedVoucher.percentOff}%)</span>
            <span className="tabular-nums">-{formatCents(discountCents)}</span>
          </div>
        )}
        <div className="flex items-center justify-between font-display text-xl font-bold text-ink">
          <span>Total / mo</span>
          <span className="tabular-nums">{formatCents(subtotalCents - discountCents)}</span>
        </div>
      </div>

      {!cart.customerId && (
        <section className="card-shadow flex flex-col gap-3 rounded-2xl border border-hairline bg-white p-5">
          <h2 className="font-display text-sm font-bold text-ink">Save my setup</h2>
          <p className="font-body text-sm text-ink-soft">
            Add your email so we can hold this setup for you and reach you if you need a hand.
          </p>
          <form onSubmit={handleIdentify} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
            <label className="flex flex-col gap-1 sm:flex-1 sm:basis-48">
              <span className="font-display text-xs font-semibold text-ink-soft">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-hairline bg-white px-3 py-2 font-body text-ink outline-none focus-visible:border-blaze"
                placeholder="ravta@example.com"
              />
            </label>
            <label className="flex flex-col gap-1 sm:flex-1 sm:basis-48">
              <span className="font-display text-xs font-semibold text-ink-soft">Name (optional)</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-hairline bg-white px-3 py-2 font-body text-ink outline-none focus-visible:border-blaze"
                placeholder="Ravta"
              />
            </label>
            <Button type="submit" disabled={identifying || !email.trim()}>
              {identifying ? "Saving…" : "Save setup"}
            </Button>
          </form>
          {identifyError && <p className="font-body text-sm text-pink">{identifyError}</p>}
        </section>
      )}

      {cart.customerId && (
        <section className="card-shadow flex flex-col gap-3 rounded-2xl border border-hairline bg-white p-5">
          <h2 className="font-display text-sm font-bold text-ink">Have a voucher?</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-1 basis-48 flex-col gap-1">
              <span className="font-display text-xs font-semibold text-ink-soft">Voucher code</span>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="rounded-xl border border-hairline bg-white px-3 py-2 font-mono text-ink outline-none focus-visible:border-blaze"
                placeholder="SAVE20-XXXXXX"
              />
            </label>
            <Button variant="secondary" type="button" disabled={checkingVoucher || !voucherCode.trim()} onClick={() => handleCheckVoucher(voucherCode)}>
              {checkingVoucher ? "Checking…" : "Apply"}
            </Button>
          </div>
          {voucherError && <p className="font-body text-sm text-pink">{voucherError}</p>}
          {appliedVoucher && <p className="font-body text-sm text-moss">Voucher applied -- {appliedVoucher.percentOff}% off.</p>}

          <div className="mt-2 flex items-center justify-between font-display text-xl font-bold tabular-nums text-ink">
            <span>Total / mo</span>
            <span>{formatCents(subtotalCents - discountCents)}</span>
          </div>
          {activateError && <p className="font-body text-sm text-pink">{activateError}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleActivate} disabled={activating}>
              {activating ? "Activating…" : "Activate now"}
            </Button>
            <span className="font-body text-sm text-ink-soft">or come back later -- we'll follow up if you don't.</span>
          </div>
        </section>
      )}
    </div>
  );
}
