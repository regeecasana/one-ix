import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { closeTicket } from "@/lib/zendesk/client";
import { requireInternalAuth, handleError } from "@/lib/apiHelpers";

export async function POST(req: Request, { params }: { params: { ticketId: string } }) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    await closeTicket(params.ticketId);
    await prisma.customer.updateMany({
      where: { activeTicketId: params.ticketId },
      data: { activeTicketId: null },
    });
    return NextResponse.json({ closed: true });
  } catch (err) {
    return handleError(err);
  }
}
