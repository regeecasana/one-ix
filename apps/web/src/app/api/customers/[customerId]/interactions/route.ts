import { NextResponse } from "next/server";
import { HttpError } from "@/lib/errors";
import { logInteraction } from "@/lib/services/interactionService";
import { serializeInteractionEvent } from "@/lib/serializers";
import { verifySession } from "@/lib/session";
import { checkRateLimit, rateLimitResponse, handleError } from "@/lib/apiHelpers";

// Generous but present -- each call posts a real Zendesk comment.
export async function POST(req: Request, { params }: { params: { customerId: string } }) {
  try {
    if (!checkRateLimit(req, "interactions", 60, 60_000)) return rateLimitResponse();

    const body = await req.json().catch(() => ({}));
    const type = String(body?.type ?? "").trim().slice(0, 64);
    const detail = String(body?.detail ?? "").trim().slice(0, 500);
    if (!type) throw new HttpError(400, "type_required");
    if (!detail) throw new HttpError(400, "detail_required");
    // Only the browser that identified as this customer (see
    // app/api/identify/route.ts) holds a token that verifies for their id --
    // stops a third party who merely observes/guesses a customerId from
    // posting fabricated interaction comments onto a ticket that isn't theirs.
    if (!verifySession(params.customerId, body?.sessionToken)) {
      throw new HttpError(403, "invalid_session");
    }

    const event = await logInteraction(params.customerId, type, detail);
    return NextResponse.json(serializeInteractionEvent(event), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
