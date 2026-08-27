import { Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { formatCents } from "../lib/money";
import { useCartStore } from "../store/cartStore";
import { SignalBars } from "../components/SignalBars";

export function OrderConfirmationPage() {
  const lastOrder = useCartStore((s) => s.lastOrder);
  const { products } = useProducts();

  if (!lastOrder) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-body text-ink">Nothing's been activated yet.</p>
        <Link to="/" className="font-mono text-sm uppercase tracking-[0.08em] text-blaze underline underline-offset-4">
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
        <SignalBars size="lg" animated />
        <span className="font-display text-lg font-bold uppercase tracking-[0.2em] text-blaze">Activated</span>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-ink">Service activated</h1>
        <p className="mt-1 font-mono text-sm text-ink-soft">Activation #{order.id}</p>
      </div>

      <div className="flex w-full max-w-lg flex-col">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 border-b border-hairline py-2">
            <span className="font-body text-ink">
              {item.quantity} × {productMap.get(item.productId)?.name ?? item.productId}
            </span>
            <span className="font-mono tabular-nums text-ink">
              {formatCents(item.unitPriceCents * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-lg flex-col gap-1">
        <div className="flex justify-between font-mono text-sm tabular-nums text-ink-soft">
          <span>Subtotal</span>
          <span>{formatCents(order.subtotalCents)}</span>
        </div>
        {order.discountCents > 0 && (
          <div className="flex justify-between font-mono text-sm tabular-nums text-moss">
            <span>Discount</span>
            <span>−{formatCents(order.discountCents)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-ink pt-1 font-mono text-xl tabular-nums text-ink">
          <span>Total</span>
          <span>{formatCents(order.totalCents)}</span>
        </div>
      </div>

      <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft">
        No real payment was processed — this is a demo.
      </p>

      <Link to="/" className="font-mono text-sm uppercase tracking-[0.08em] text-blaze underline underline-offset-4">
        Back to catalog
      </Link>
    </div>
  );
}
