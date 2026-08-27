import { NextResponse } from "next/server";
import { HttpError } from "@/lib/errors";
import { identifyCustomer } from "@/lib/services/identifyService";
import { signSession } from "@/lib/session";
import { checkRateLimit, rateLimitResponse, handleError } from "@/lib/apiHelpers";

// Creates a real Zendesk ticket per new identity -- cap abuse.
export async function POST(req: Request) {
  try {
    if (!checkRateLimit(req, "identify", 10, 60_000)) return rateLimitResponse();

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!email) throw new HttpError(400, "email_required");

    const name = body?.name ? String(body.name) : undefined;
    const cartId = body?.cartId ? String(body.cartId) : undefined;
    const bufferedEvents = Array.isArray(body?.bufferedEvents)
      ? body.bufferedEvents
          .filter((e: unknown): e is { type: unknown; detail: unknown } => typeof e === "object" && e !== null)
          .map((e: { type: unknown; detail: unknown }) => ({ type: String(e.type ?? ""), detail: String(e.detail ?? "") }))
          .filter((e: { type: string; detail: string }) => e.type && e.detail)
      : [];

    const customer = await identifyCustomer(email, { name, cartId, bufferedEvents });
    return NextResponse.json({ customerId: customer.id, sessionToken: signSession(customer.id) }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
