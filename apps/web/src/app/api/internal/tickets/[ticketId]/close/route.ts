import { NextResponse } from "next/server";
import { findLatest } from "@/lib/bird/objects";
import type { BirdActivityTicket } from "@/lib/bird/types";
import { closeTicket } from "@/lib/zendesk/client";
import { getContactById, upsertContact } from "@/lib/bird/client";
import { requireInternalAuth, handleError } from "@/lib/apiHelpers";

export async function POST(req: Request, { params }: { params: { ticketId: string } }) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    await closeTicket(params.ticketId);

    const activityTicket = await findLatest<BirdActivityTicket>("activity_tickets", [
      { attribute: "ticketId", operator: "string/equals", value: params.ticketId },
    ]);
    if (activityTicket) {
      const customer = await getContactById(activityTicket.customerId);
      if (customer?.activeTicketId === params.ticketId) {
        await upsertContact({ email: customer.email, activeTicketId: null });
      }
    }

    return NextResponse.json({ closed: true });
  } catch (err) {
    return handleError(err);
  }
}
