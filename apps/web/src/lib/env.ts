import { randomBytes } from "crypto";

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// Signs the per-customer session token issued at identify time (see
// session.ts). Falls back to a random per-process secret so local dev
// works with no setup -- sessions just won't survive a restart, which is
// fine for a demo.
const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
if (!process.env.SESSION_SECRET) {
  console.warn("[env] SESSION_SECRET not set -- using a random per-process secret (sessions reset on restart)");
}

// Storefront and API are the same Next.js app now -- siteUrl is only used
// to build absolute links in outbound emails. Vercel sets VERCEL_URL
// automatically on every deployment (preview and production).
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const env = {
  siteUrl,
  internalApiToken: process.env.INTERNAL_API_TOKEN ?? "",
  sessionSecret,
  zendesk: {
    subdomain: process.env.ZENDESK_SUBDOMAIN ?? "",
    email: process.env.ZENDESK_EMAIL ?? "",
    apiToken: process.env.ZENDESK_API_TOKEN ?? "",
  },
  voucherTtlMinutes: num("VOUCHER_TTL_MINUTES", 30),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
};
