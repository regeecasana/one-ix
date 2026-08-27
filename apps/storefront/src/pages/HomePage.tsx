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
    <div className="flex flex-col gap-14">
      <section className="overflow-hidden rounded-3xl bg-gradient-primary px-6 py-14 text-center sm:px-12">
        {campaignLabel && (
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            From {utmSource ?? "our campaign"} · {campaignLabel}
          </p>
        )}
        <h1 className="mx-auto mt-3 max-w-xl font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl">
          Build the connection that powers your creativity
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-base text-white/85">
          {campaignLabel
            ? "Let's build a connectivity setup around how you actually use your phone -- not a generic plan list."
            : "Three quick questions. One plan that actually fits. No generic plan list to scroll through."}
        </p>
        <Link
          to="/builder"
          className="mt-7 inline-block rounded-full bg-white px-8 py-3 font-display text-sm font-bold text-blaze shadow-lg transition hover:opacity-90"
        >
          Build My Setup →
        </Link>
      </section>

      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Or browse the catalog</h2>
          {products && <span className="eyebrow">{products.length} items</span>}
        </div>

        {error && <p className="font-body text-sm text-pink">{error}</p>}

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-lavender" />
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
