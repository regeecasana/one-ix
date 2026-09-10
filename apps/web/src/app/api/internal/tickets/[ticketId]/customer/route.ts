import { NextResponse } from "next/server";
import { findLatest } from "@/lib/bird/objects";
import type { BirdActivityTicket, BirdSupportTicket } from "@/lib/bird/types";
import { HttpError } from "@/lib/errors";
import { requireInternalAuth, handleError } from "@/lib/apiHelpers";

export async function GET(req: Request, { params }: { params: { ticketId: string } }) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const activityTicket = await findLatest<BirdActivityTicket>("activityTickets", [
      { attribute: "ticketId", operator: "string/equals", value: params.ticketId },
    ]);
    if (activityTicket) {
      return NextResponse.json({ customerId: activityTicket.customerId });
    }

    // Fall back to the standalone support-ticket flow, which isn't
    // reconciled with the per-customer activity ticket -- see
    // docs/api-spec.md.
    const supportTicket = await findLatest<BirdSupportTicket>("supportTickets", [
      { attribute: "zendeskTicketId", operator: "string/equals", value: params.ticketId },
    ]);
    if (!supportTicket) throw new HttpError(404, "customer_not_found_for_ticket");
    return NextResponse.json({ customerId: supportTicket.customerId });
  } catch (err) {
    return handleError(err);
  }
}
