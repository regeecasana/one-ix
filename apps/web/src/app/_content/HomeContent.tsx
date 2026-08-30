"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { ProductIcon } from "@/components/ProductIcon";
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

const WHAT_WE_OFFER: { category: string; title: string; description: string }[] = [
  { category: "MOBILE", title: "Mobile", description: "Data plans from light everyday use to true unlimited, 5G priority." },
  { category: "HOME", title: "Home & Fiber", description: "Fiber internet for the whole house, with mesh WiFi where you need it." },
  { category: "FAMILY", title: "Family", description: "Shared data across every line in the house, one bill, individual caps." },
  { category: "ROAMING", title: "Roaming", description: "Regional and global data passes so you stay connected abroad." },
  { category: "BUSINESS", title: "Business", description: "Pooled data and dedicated support for teams, from 5 lines to 20+." },
];

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

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center">
        <div>
          <span className="eyebrow text-blaze">What is XLSmart?</span>
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
            One connectivity provider, built around how you actually connect
          </h2>
          <p className="mt-3 font-body text-sm text-ink-soft">
            XLSmart is a connectivity provider covering mobile, home fiber, family bundles, roaming,
            and business lines under one account. Instead of scrolling a generic plan list, the
            Connectivity Builder asks what you actually use your connection for and recommends the one
            setup that fits -- then keeps it saved so you can activate whenever you're ready.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {WHAT_WE_OFFER.map((item) => (
            <div key={item.category} className="rounded-2xl border border-hairline bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender text-blaze">
                <ProductIcon productId="" category={item.category} className="h-6 w-6" />
              </div>
              <p className="mt-3 font-display text-sm font-bold text-ink">{item.title}</p>
              <p className="mt-1 font-body text-xs text-ink-soft">{item.description}</p>
            </div>
          ))}
        </div>
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
