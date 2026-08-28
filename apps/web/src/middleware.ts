import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// /api/internal/* and /api/products are called from the Zendesk sidebar
// app, which runs on a different origin (a Zendesk subdomain, or the
// local zat server during dev) -- unlike the storefront, which shares
// this app's own origin. /api/internal/* is already gated by the
// X-Internal-Token shared secret, so a permissive CORS policy here
// doesn't newly expose anything a direct server-to-server call couldn't
// already reach. /api/products is public and read-only regardless.
export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return withCors(new NextResponse(null, { status: 204 }));
  }
  return withCors(NextResponse.next());
}

function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Internal-Token");
  return res;
}

export const config = {
  matcher: ["/api/internal/:path*", "/api/products", "/api/products/:path*"],
};
