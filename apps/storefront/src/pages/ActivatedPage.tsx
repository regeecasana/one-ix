import { Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { formatCents } from "../lib/money";
import { useCartStore } from "../store/cartStore";
import { Mark } from "../components/Mark";

export function ActivatedPage() {
  const lastOrder = useCartStore((s) => s.lastOrder);
  const { products } = useProducts();

  if (!lastOrder) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-body text-ink">Nothing's been activated yet.</p>
        <Link to="/" className="font-display text-sm font-semibold text-blaze underline underline-offset-4">
          Back to catalog
        </Link>
      </div>
    );
  }

  const { order, items } = lastOrder;
  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  return (
    <div className="flex flex-col items-start gap-8">
      <div className="flex items-center gap-4">
        <Mark size="lg" />
        <span className="font-display text-lg font-bold text-blaze">Activated</span>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Your setup is active</h1>
        <p className="mt-1 font-mono text-sm text-ink-soft">Activation #{order.id}</p>
      </div>

      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-hairline bg-white">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 border-b border-hairline p-4 last:border-b-0">
            <span className="font-body text-ink">
              {item.quantity} × {productMap.get(item.productId)?.name ?? item.productId}
            </span>
            <span className="font-display tabular-nums text-ink">
              {formatCents(item.unitPriceCents * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-lg flex-col gap-1 rounded-2xl bg-lavender p-5">
        <div className="flex justify-between font-body text-sm text-ink-soft">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCents(order.subtotalCents)}</span>
        </div>
        {order.discountCents > 0 && (
          <div className="flex justify-between font-body text-sm text-moss">
            <span>Voucher discount</span>
            <span className="tabular-nums">-{formatCents(order.discountCents)}</span>
          </div>
        )}
        <div className="flex justify-between font-display text-xl font-bold text-ink">
          <span>Total / mo</span>
          <span className="tabular-nums">{formatCents(order.totalCents)}</span>
        </div>
      </div>

      <p className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
        No real payment was processed — this is a demo.
      </p>

      <Link to="/" className="font-display text-sm font-semibold text-blaze underline underline-offset-4">
        Back to catalog
      </Link>
    </div>
  );
}
