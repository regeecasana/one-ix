import { Link } from "react-router-dom";
import type { Product } from "@oneix/shared";
import { formatCents } from "../lib/money";
import { productCategory } from "../lib/productMeta";
import { useCartStore } from "../store/cartStore";
import { ProductIcon } from "./ProductIcon";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCartStore((s) => s.cart);
  const addItem = useCartStore((s) => s.addItem);
  const logEvent = useCartStore((s) => s.logEvent);

  const currentQty = cart?.items.find((i) => i.productId === product.id)?.quantity ?? 0;

  return (
    <div className="card-shadow flex flex-col overflow-hidden rounded-2xl border border-hairline bg-white">
      <Link
        to={`/products/${product.id}`}
        onClick={() => logEvent("clicked_plan", `Customer clicks the Plan ${product.name}`)}
        className="flex aspect-[3/2] items-center justify-center bg-lavender text-blaze"
      >
        <ProductIcon productId={product.id} className="h-20 w-20" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="eyebrow text-blaze">{productCategory(product.id)}</span>
        <Link to={`/products/${product.id}`} className="font-display text-lg font-bold leading-tight text-ink">
          {product.name}
        </Link>
        <p className="flex-1 font-body text-sm text-ink-soft">{product.description}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="font-display text-base font-bold tabular-nums text-ink">
            {formatCents(product.priceCents)}
            <span className="font-body text-xs font-normal text-ink-soft">/mo</span>
          </span>
          <button
            type="button"
            onClick={() => {
              addItem(product.id, currentQty + 1);
              logEvent("saved_setup", `Customer adds to cart ${product.name}`);
            }}
            className="rounded-full border border-blaze px-3 py-1.5 font-display text-xs font-semibold text-blaze transition-colors hover:bg-blaze hover:text-white"
            aria-label={`Add ${product.name} to setup`}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
