import { useEffect, useState } from "react";
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
  const logEvent = useCartStore((s) => s.logEvent);
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (product) logEvent("clicked_plan", `Customer clicks the Plan ${product.name}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (error) {
    return <p className="font-body text-sm text-pink">{error}</p>;
  }

  if (!product) {
    return loading ? (
      <p className="font-mono text-sm text-ink-soft">Loading item…</p>
    ) : (
      <div className="flex flex-col gap-4">
        <p className="font-body text-ink">That item isn't on file.</p>
        <Link to="/" className="font-display text-sm font-semibold text-blaze underline underline-offset-4">
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
      logEvent("saved_setup", `Customer adds to cart ${product!.name}`);
      navigate("/setup");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div className="card-shadow flex aspect-[3/2] items-center justify-center rounded-2xl bg-lavender text-blaze lg:aspect-square">
        <ProductIcon productId={product.id} className="h-32 w-32" />
      </div>

      <div className="flex flex-col gap-4">
        <span className="eyebrow text-blaze">
          {productCategory(product.id)} · In stock · {product.stock}
        </span>
        <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">{product.name}</h1>
        <p className="font-body text-base text-ink-soft">{product.description}</p>
        <p className="font-display text-2xl font-bold tabular-nums text-ink">
          {formatCents(product.priceCents)}
          <span className="font-body text-sm font-normal text-ink-soft">/mo</span>
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center rounded-full border border-hairline">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-4 py-2 font-display text-ink hover:text-blaze"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center font-display tabular-nums text-ink">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-4 py-2 font-display text-ink hover:text-blaze"
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
