import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { ProductCard } from "../components/ProductCard";
import { useCartStore } from "../store/cartStore";

const CAMPAIGN_COPY: Record<string, string> = {
  "creator-package": "Creator Package",
};

export function HomePage() {
  const { products, loading, error } = useProducts();
  const [searchParams] = useSearchParams();
  const captureAttribution = useCartStore((s) => s.captureAttribution);

  const utmSource = searchParams.get("utm_source") ?? undefined;
  const utmCampaign = searchParams.get("utm_campaign") ?? undefined;
  const utmContent = searchParams.get("utm_content") ?? undefined;

  useEffect(() => {
    if (utmSource || utmCampaign || utmContent) {
      captureAttribution({ utmSource, utmCampaign, utmContent });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utmSource, utmCampaign, utmContent]);

  const campaignLabel = utmCampaign ? CAMPAIGN_COPY[utmCampaign] ?? utmCampaign : null;

  return (
    <div className="flex flex-col gap-12">
      <section className="max-w-2xl">
        {campaignLabel && (
          <p className="eyebrow mb-3">
            From {utmSource ?? "our campaign"} · {campaignLabel}
          </p>
        )}
        <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-ink sm:text-6xl">
          Stay in range.
        </h1>
        <p className="mt-5 font-body text-base text-ink-soft">
          {campaignLabel
            ? "Let's build a connectivity setup around how you actually use your phone -- not a generic plan list."
            : "A working demo store -- setups really get saved, nudges really get sent, activations really happen. No real payment is ever taken. No real network, either."}
        </p>
        <Link
          to="/builder"
          className="mt-6 inline-block bg-blaze px-6 py-3 font-mono text-sm uppercase tracking-[0.1em] text-canvas transition-colors hover:bg-blaze-dark"
        >
          Build my setup →
        </Link>
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
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
