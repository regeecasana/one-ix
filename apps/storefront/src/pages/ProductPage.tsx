import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProduct } from "../hooks/useProducts";
import { formatCents } from "../lib/money";
import { useCartStore } from "../store/cartStore";
import { Button } from "../components/Button";
import { ProductIcon } from "../components/ProductIcon";
import { productCategory } from "../lib/productMeta";

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { product, loading, error } = useProduct(id);
  const cart = useCartStore((s) => s.cart);
  const addItem = useCartStore((s) => s.addItem);
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  if (error) {
    return <p className="font-body text-sm text-blaze">{error}</p>;
  }

  if (!product) {
    return loading ? (
      <p className="font-mono text-sm text-ink-soft">Loading item…</p>
    ) : (
      <div className="flex flex-col gap-4">
        <p className="font-body text-ink">That item isn't on file.</p>
        <Link to="/" className="font-mono text-sm uppercase tracking-[0.08em] text-blaze underline underline-offset-4">
          Back to catalog
        </Link>
      </div>
    );
  }

  const currentQty = cart?.items.find((i) => i.productId === product.id)?.quantity ?? 0;

  async function handleAdd() {
    setAdding(true);
    try {
      await addItem(product!.id, currentQty + quantity);
      navigate("/setup");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div className="flex aspect-[3/2] items-center justify-center border border-hairline bg-canvas text-ink-soft lg:aspect-square">
        <ProductIcon productId={product.id} className="h-40 w-40" />
      </div>

      <div className="flex flex-col gap-4">
        <span className="eyebrow">
          {productCategory(product.id)} · In stock · {product.stock}
        </span>
        <h1 className="font-display text-4xl font-bold uppercase leading-none text-ink">{product.name}</h1>
        <p className="font-body text-base text-ink-soft">{product.description}</p>
        <p className="font-mono text-2xl tabular-nums text-ink">{formatCents(product.priceCents)}/mo</p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center border border-ink">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 font-mono text-ink hover:bg-ink hover:text-canvas"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center font-mono tabular-nums text-ink">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-2 font-mono text-ink hover:bg-ink hover:text-canvas"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <Button onClick={handleAdd} disabled={adding}>
            {adding ? "Adding…" : "Add to setup"}
          </Button>
        </div>
      </div>
    </div>
  );
}
