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
  // Prefixed WEB_ -- ZENDESK_SUBDOMAIN/EMAIL/API_TOKEN collide with names
  // zcli's own global config uses (apps/zendesk-ticket-sidebar-app), and a
  // machine-level env var of that name always wins over anything in this
  // app's .env.local (Next.js/dotenv never override pre-existing
  // process.env). Scoping these to this app is what actually fixes it --
  // renaming the .env file wouldn't, since OS env still outranks any
  // .env* file regardless of filename.
  zendesk: {
    subdomain: process.env.WEB_ZENDESK_SUBDOMAIN ?? "",
    email: process.env.WEB_ZENDESK_EMAIL ?? "",
    apiToken: process.env.WEB_ZENDESK_API_TOKEN ?? "",
    // This Zendesk account hosts many brands (client demos) on one shared
    // instance -- without an explicit brand_id, ticket creation silently
    // falls back to the account's default brand instead of ours. Optional
    // because a single-brand account doesn't need it.
    brandId: process.env.WEB_ZENDESK_BRAND_ID ?? "",
  },
  voucherTtlMinutes: num("VOUCHER_TTL_MINUTES", 30),
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  // Bird (app.bird.com) CDP -- this app's sole datastore, see
  // docs/architecture.md. The host is always https://api.bird.com
  // regardless of the workspace's data-storage region (EU/US) -- that
  // setting affects where Bird stores your data, not which API host you
  // call. Bird calls no-op (with a warning) until these are set.
  bird: {
    apiKey: process.env.BIRD_API_KEY ?? "",
    workspaceId: process.env.BIRD_WORKSPACE_ID ?? "",
  },
};
