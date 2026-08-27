import { NextResponse } from "next/server";
import { HttpError } from "@/lib/errors";
import { submitSupportTicket } from "@/lib/services/supportService";
import { serializeSupportTicket } from "@/lib/serializers";
import { checkRateLimit, rateLimitResponse, handleError } from "@/lib/apiHelpers";

// Each submission creates a real Zendesk ticket -- cap abuse.
export async function POST(req: Request) {
  try {
    if (!checkRateLimit(req, "support-ticket", 5, 60_000)) return rateLimitResponse();

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const subject = String(body?.subject ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!email) throw new HttpError(400, "email_required");
    if (!subject) throw new HttpError(400, "subject_required");
    if (!message) throw new HttpError(400, "message_required");

    const ticket = await submitSupportTicket({ email, subject, message });
    return NextResponse.json(serializeSupportTicket(ticket), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
