import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { formatCents } from "../lib/money";
import { useCartStore } from "../store/cartStore";
import { Button } from "../components/Button";

export function CartPage() {
  const cart = useCartStore((s) => s.cart);
  const loading = useCartStore((s) => s.loading);
  const refresh = useCartStore((s) => s.refresh);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const { products } = useProducts();
  const navigate = useNavigate();

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const subtotalCents = (cart?.items ?? []).reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);

  if (loading && !cart) {
    return <p className="font-mono text-sm text-ink-soft">Loading manifest…</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-3xl font-bold uppercase text-ink">Manifest</h1>
        <p className="font-body text-ink-soft">Nothing on the manifest yet.</p>
        <Link to="/" className="font-mono text-sm uppercase tracking-[0.08em] text-blaze underline underline-offset-4">
          Browse the catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold uppercase text-ink">Manifest</h1>

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
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline py-3"
            >
              <span className="w-full font-body text-ink sm:w-auto sm:flex-1">
                {product?.name ?? item.productId}
              </span>

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
        <span className="eyebrow">Subtotal</span>
        <span className="font-mono text-xl tabular-nums text-ink">{formatCents(subtotalCents)}</span>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => navigate("/checkout")}>Proceed to dispatch →</Button>
      </div>
    </div>
  );
}
