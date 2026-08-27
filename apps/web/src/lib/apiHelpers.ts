import { NextResponse } from "next/server";
import { HttpError } from "./errors";
import { env } from "./env";

export function handleError(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}

// Fail closed: an unconfigured INTERNAL_API_TOKEN rejects every request
// rather than accepting any token. Called by the Zendesk sidebar app only.
export function requireInternalAuth(req: Request): NextResponse | null {
  const token = req.headers.get("x-internal-token");
  if (!env.internalApiToken || token !== env.internalApiToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

// Best-effort, in-memory, per-warm-instance rate limiting -- not a global
// limit across every serverless instance, but cheap defense-in-depth for a
// demo without provisioning Redis or similar just for this. See
// docs/architecture.md.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(req: Request, key: string, limit: number, windowMs: number): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json({ error: "rate_limited" }, { status: 429 });
}
