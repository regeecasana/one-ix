import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { BuilderRecommendation } from "@oneix/shared";
import { recommendPlan } from "../lib/api";
import { useProduct } from "../hooks/useProducts";
import { formatCents } from "../lib/money";
import { useCartStore } from "../store/cartStore";
import { Button } from "../components/Button";
import { ProductIcon } from "../components/ProductIcon";

const USAGE_OPTIONS = [
  { value: "streaming", label: "Content creation & livestreaming" },
  { value: "work", label: "Work calls & video meetings" },
  { value: "gaming", label: "Gaming" },
  { value: "everyday", label: "Everyday browsing" },
];

const DEVICES_OPTIONS = [
  { value: "just-phone", label: "Just my phone" },
  { value: "phone-laptop", label: "Phone + laptop" },
  { value: "household", label: "My whole household" },
];

export function BuilderPage() {
  const [usage, setUsage] = useState("");
  const [devices, setDevices] = useState("");
  const [recommendation, setRecommendation] = useState<BuilderRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const { product } = useProduct(recommendation?.productId);
  const addItem = useCartStore((s) => s.addItem);
  const setRecommendationReason = useCartStore((s) => s.setRecommendationReason);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usage || !devices) return;
    setLoading(true);
    try {
      const result = await recommendPlan(usage, devices);
      setRecommendation(result);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToSetup() {
    if (!recommendation) return;
    setAdding(true);
    try {
      await addItem(recommendation.productId, 1);
      await setRecommendationReason(recommendation.reason);
      navigate("/setup");
    } finally {
      setAdding(false);
    }
  }

  if (recommendation && product) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl font-bold uppercase text-ink">Your recommended setup</h1>

        <div className="flex flex-col gap-4 border border-hairline bg-canvas p-6 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center text-ink-soft">
            <ProductIcon productId={product.id} className="h-20 w-20" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold uppercase text-ink">{product.name}</h2>
            <p className="mt-1 font-mono text-lg tabular-nums text-ink">{formatCents(product.priceCents)}/mo</p>
            <p className="mt-3 font-body text-sm text-ink-soft">{recommendation.reason}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleAddToSetup} disabled={adding}>
            {adding ? "Saving…" : "Add to my setup"}
          </Button>
          <Button variant="secondary" onClick={() => setRecommendation(null)}>
            Start over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase text-ink">Connectivity Builder</h1>
        <p className="mt-2 font-body text-sm text-ink-soft">
          A couple of quick questions, then one recommended plan -- not a generic list.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-2">
          <legend className="eyebrow mb-2">How do you use your connection most?</legend>
          {USAGE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 border border-hairline bg-canvas px-4 py-3">
              <input
                type="radio"
                name="usage"
                value={opt.value}
                checked={usage === opt.value}
                onChange={() => setUsage(opt.value)}
                className="accent-blaze"
              />
              <span className="font-body text-ink">{opt.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="eyebrow mb-2">How many devices need coverage?</legend>
          {DEVICES_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 border border-hairline bg-canvas px-4 py-3">
              <input
                type="radio"
                name="devices"
                value={opt.value}
                checked={devices === opt.value}
                onChange={() => setDevices(opt.value)}
                className="accent-blaze"
              />
              <span className="font-body text-ink">{opt.label}</span>
            </label>
          ))}
        </fieldset>

        <Button type="submit" disabled={!usage || !devices || loading}>
          {loading ? "Finding your plan…" : "Get my recommendation"}
        </Button>
      </form>
    </div>
  );
}
