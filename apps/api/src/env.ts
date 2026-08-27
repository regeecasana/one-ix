function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  port: num("PORT", 4000),
  storefrontUrl: process.env.STOREFRONT_URL ?? "http://localhost:5173",
  internalApiToken: process.env.INTERNAL_API_TOKEN ?? "",
  zendesk: {
    subdomain: process.env.ZENDESK_SUBDOMAIN ?? "",
    email: process.env.ZENDESK_EMAIL ?? "",
    apiToken: process.env.ZENDESK_API_TOKEN ?? "",
  },
  abandonThresholdMs: num("ABANDON_THRESHOLD_MS", 60_000),
  abandonSweepIntervalMs: num("ABANDON_SWEEP_INTERVAL_MS", 15_000),
};
