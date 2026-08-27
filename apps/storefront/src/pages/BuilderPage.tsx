import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { BuilderRecommendation } from "@oneix/shared";
import { recommendPlan } from "../lib/api";
import { useProduct } from "../hooks/useProducts";
import { formatCents } from "../lib/money";
import { useCartStore } from "../store/cartStore";
import { Button } from "../components/Button";
import { ProductIcon } from "../components/ProductIcon";

const USAGE_OPTIONS = [
  { value: "streaming", label: "Livestreaming" },
  { value: "uploading", label: "Uploading Content" },
  { value: "gaming", label: "Gaming" },
  { value: "work", label: "Remote Work" },
  { value: "entertainment", label: "Entertainment" },
  { value: "family", label: "Family Connectivity" },
];

const DEVICES_OPTIONS = [
  { value: "light", label: "1–3 devices", hint: "Light" },
  { value: "household", label: "4–7 devices", hint: "Household" },
  { value: "creator-studio", label: "8–12 devices", hint: "Creator studio" },
  { value: "power-user", label: "12+ devices", hint: "Power user" },
];

const PRIORITY_OPTIONS = [
  { value: "speed", label: "Speed" },
  { value: "reliability", label: "Reliability" },
  { value: "upload", label: "Upload Performance" },
  { value: "flexibility", label: "Flexibility" },
  { value: "value", label: "Value" },
];

type Step = 1 | 2 | 3;

function StepShell({
  step,
  title,
  children,
  onBack,
  canContinue,
  onContinue,
  continueLabel = "Continue",
}: {
  step: Step;
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  canContinue: boolean;
  onContinue: () => void;
  continueLabel?: string;
}) {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-gradient-primary" : "bg-hairline"}`}
          />
        ))}
      </div>
      <div>
        <span className="eyebrow text-blaze">Step {step} of 3</span>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
      </div>

      {children}

      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        )}
        <Button onClick={onContinue} disabled={!canContinue}>
          {continueLabel}
        </Button>
      </div>
    </div>
  );
}

export function BuilderPage() {
  const [step, setStep] = useState<Step>(1);
  const [usage, setUsage] = useState<string[]>([]);
  const [devices, setDevices] = useState("");
  const [priority, setPriority] = useState("");
  const [recommendation, setRecommendation] = useState<BuilderRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { product } = useProduct(recommendation?.productId);
  const addItem = useCartStore((s) => s.addItem);
  const setRecommendationReason = useCartStore((s) => s.setRecommendationReason);
  const logEvent = useCartStore((s) => s.logEvent);
  const navigate = useNavigate();

  useEffect(() => {
    logEvent("started_builder", "Customer starts the Connectivity Builder");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleUsage(value: string) {
    setUsage((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function handleGetRecommendation() {
    setLoading(true);
    try {
      const result = await recommendPlan(usage, devices, priority);
      setRecommendation(result);
      logEvent("completed_builder", `Customer completes the Connectivity Builder: ${result.reason}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(navigateTo: string, eventDetail: string) {
    if (!recommendation) return;
    setSaving(true);
    try {
      await addItem(recommendation.productId, 1);
      await setRecommendationReason(recommendation.reason);
      logEvent("saved_setup", eventDetail);
      navigate(navigateTo);
    } finally {
      setSaving(false);
    }
  }

  if (recommendation && product) {
    const features = product.description.split(". ").flatMap((s) => s.split(", ")).map((s) => s.trim()).filter(Boolean);
    const tags = [...usage.map((u) => USAGE_OPTIONS.find((o) => o.value === u)?.label ?? u), PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? priority];

    return (
      <div className="flex max-w-xl flex-col gap-6">
        <div>
          <span className="eyebrow text-blaze">Your recommendation</span>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
            Built around how you actually connect
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-lavender px-3 py-1 font-display text-xs font-semibold text-blaze">
              {tag}
            </span>
          ))}
        </div>

        <div className="card-shadow rounded-2xl border border-hairline bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-lavender text-blaze">
              <ProductIcon productId={product.id} className="h-10 w-10" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">{product.name}</h2>
              <p className="font-display text-lg font-bold tabular-nums text-ink">
                {formatCents(product.priceCents)}
                <span className="font-body text-sm font-normal text-ink-soft">/mo</span>
              </p>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 font-body text-sm text-ink">
                <span className="mt-0.5 text-moss">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-lavender p-5">
          <h3 className="font-display text-sm font-bold text-ink">Why we recommend this</h3>
          <p className="mt-1 font-body text-sm text-ink-soft">{recommendation.reason}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={saving}
            onClick={() => handleSave("/setup", `Customer adds to cart ${product.name}`)}
          >
            {saving ? "Saving…" : "Save My Setup"}
          </Button>
          <Button
            className="flex-1"
            disabled={saving}
            onClick={() => handleSave("/setup?activate=1", `Customer adds to cart ${product.name} and requests activation`)}
          >
            {saving ? "Saving…" : "Activate Now"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <StepShell
        step={1}
        title="What do you use your connection for?"
        canContinue={usage.length > 0}
        onContinue={() => setStep(2)}
      >
        <p className="-mt-4 font-body text-sm text-ink-soft">Select all that apply.</p>
        <div className="grid grid-cols-2 gap-3">
          {USAGE_OPTIONS.map((opt) => {
            const selected = usage.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleUsage(opt.value)}
                className={`rounded-2xl border px-4 py-4 text-left font-display text-sm font-semibold transition ${
                  selected ? "border-transparent bg-gradient-primary text-white" : "border-hairline bg-white text-ink hover:border-blaze"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </StepShell>
    );
  }

  if (step === 2) {
    return (
      <StepShell
        step={2}
        title="How many devices connect regularly?"
        onBack={() => setStep(1)}
        canContinue={!!devices}
        onContinue={() => setStep(3)}
      >
        <div className="flex flex-col gap-3">
          {DEVICES_OPTIONS.map((opt) => {
            const selected = devices === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDevices(opt.value)}
                className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left font-display transition ${
                  selected ? "border-transparent bg-gradient-primary text-white" : "border-hairline bg-white text-ink hover:border-blaze"
                }`}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className={`text-xs ${selected ? "text-white/80" : "text-ink-soft"}`}>{opt.hint}</span>
              </button>
            );
          })}
        </div>
      </StepShell>
    );
  }

  return (
    <StepShell
      step={3}
      title="What matters most?"
      onBack={() => setStep(2)}
      canContinue={!!priority && !loading}
      onContinue={handleGetRecommendation}
      continueLabel={loading ? "Finding your plan…" : "See my recommendation"}
    >
      <div className="flex flex-col gap-3">
        {PRIORITY_OPTIONS.map((opt) => {
          const selected = priority === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              className={`rounded-2xl border px-5 py-4 text-left font-display text-sm font-semibold transition ${
                selected ? "border-transparent bg-gradient-primary text-white" : "border-hairline bg-white text-ink hover:border-blaze"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
