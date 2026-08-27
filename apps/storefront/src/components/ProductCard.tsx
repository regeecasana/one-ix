import { Link } from "react-router-dom";
import type { Product } from "@oneix/shared";
import { formatCents } from "../lib/money";
import { productCategory } from "../lib/productMeta";
import { useCartStore } from "../store/cartStore";
import { ProductIcon } from "./ProductIcon";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCartStore((s) => s.cart);
  const addItem = useCartStore((s) => s.addItem);

  const currentQty = cart?.items.find((i) => i.productId === product.id)?.quantity ?? 0;

  return (
    <div className="flex flex-col border border-hairline bg-canvas">
      <Link
        to={`/products/${product.id}`}
        className="flex aspect-[3/2] items-center justify-center border-b border-hairline bg-paper text-ink-soft transition-colors hover:text-ink"
      >
        <ProductIcon productId={product.id} className="h-24 w-24" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="eyebrow">{productCategory(product.id)}</span>
        <Link to={`/products/${product.id}`} className="font-display text-xl font-semibold leading-tight text-ink">
          {product.name}
        </Link>
        <p className="flex-1 font-body text-sm text-ink-soft">{product.description}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="font-mono text-base tabular-nums text-ink">{formatCents(product.priceCents)}</span>
          <button
            type="button"
            onClick={() => addItem(product.id, currentQty + 1)}
            className="border border-ink px-3 py-1 font-mono text-xs uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-canvas"
            aria-label={`Add ${product.name} to setup`}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
