import { Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { formatCents } from "../lib/money";
import { useCartStore } from "../store/cartStore";

export function OrderConfirmationPage() {
  const lastOrder = useCartStore((s) => s.lastOrder);
  const { products } = useProducts();

  if (!lastOrder) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-body text-ink">Nothing's been dispatched yet.</p>
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
      <div>
        <span className="stamp">Issued</span>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-ink">Dispatch confirmed</h1>
        <p className="mt-1 font-mono text-sm text-ink-soft">Manifest #{order.id}</p>
      </div>

      <table className="w-full max-w-lg border-collapse text-left">
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-hairline">
              <td className="py-2 font-body text-ink">
                {item.quantity} × {productMap.get(item.productId)?.name ?? item.productId}
              </td>
              <td className="py-2 text-right font-mono tabular-nums text-ink">
                {formatCents(item.unitPriceCents * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
