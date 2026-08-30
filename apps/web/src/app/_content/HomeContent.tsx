"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { useCartStore } from "@/store/cartStore";
import { PRODUCT_CATEGORIES, productCategory } from "@/lib/productMeta";

const CAMPAIGN_COPY: Record<string, string> = {
  "creator-package": "Creator Package",
};

const CATEGORY_LABELS: Record<string, string> = {
  MOBILE: "Mobile",
  FAMILY: "Family",
  HOME: "Home & Fiber",
  ROAMING: "Roaming",
  BUSINESS: "Business",
  "ADD-ON": "Add-ons",
};

export function HomeContent() {
  const { products, loading, error } = useProducts();
  const searchParams = useSearchParams();
  const captureAttribution = useCartStore((s) => s.captureAttribution);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (!products) return products;
    if (!activeCategory) return products;
    return products.filter((p) => productCategory(p.id) === activeCategory);
  }, [products, activeCategory]);

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
          href="/builder"
          className="mt-7 inline-block rounded-full bg-white px-8 py-3 font-display text-sm font-bold text-blaze shadow-lg transition hover:opacity-90"
        >
          Build My Setup →
        </Link>
      </section>

      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Or browse the catalog</h2>
          {filteredProducts && <span className="eyebrow">{filteredProducts.length} items</span>}
        </div>

        {products && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-4 py-1.5 font-display text-xs font-semibold transition ${
                activeCategory === null
                  ? "bg-gradient-primary text-white"
                  : "border border-hairline bg-white text-ink-soft hover:border-blaze"
              }`}
            >
              All
            </button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 font-display text-xs font-semibold transition ${
                  activeCategory === cat
                    ? "bg-gradient-primary text-white"
                    : "border border-hairline bg-white text-ink-soft hover:border-blaze"
                }`}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        )}

        {error && <p className="font-body text-sm text-pink">{error}</p>}

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-lavender" />
            ))}
          </div>
        )}

        {filteredProducts && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
