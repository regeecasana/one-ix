import { useProducts } from "../hooks/useProducts";
import { ProductCard } from "../components/ProductCard";

export function HomePage() {
  const { products, loading, error } = useProducts();

  return (
    <div className="flex flex-col gap-12">
      <section className="max-w-2xl">
        <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-ink sm:text-6xl">
          Everyday gear,
          <br />
          issued to spec.
        </h1>
        <p className="mt-5 font-body text-base text-ink-soft">
          Five items, no fluff. This is a working demo store — carts really abandon, coupons
          really expire, orders really get issued. No real payment is ever taken.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between border-b border-hairline pb-2">
          <h2 className="eyebrow">Catalog</h2>
          {products && <span className="eyebrow">{products.length} items</span>}
        </div>

        {error && <p className="font-body text-sm text-blaze">{error}</p>}

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse border border-hairline bg-canvas" />
            ))}
          </div>
        )}

        {products && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
