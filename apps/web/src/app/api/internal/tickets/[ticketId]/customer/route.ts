import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { requireInternalAuth, handleError } from "@/lib/apiHelpers";

export async function GET(req: Request, { params }: { params: { ticketId: string } }) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const customer = await prisma.customer.findFirst({ where: { activeTicketId: params.ticketId } });
    if (customer) {
      return NextResponse.json({ customerId: customer.id });
    }

    // Fall back to the standalone support-ticket flow, which isn't
    // reconciled with the per-customer activity ticket -- see
    // docs/api-spec.md.
    const supportTicket = await prisma.supportTicket.findFirst({
      where: { zendeskTicketId: params.ticketId },
      orderBy: { createdAt: "desc" },
    });
    if (!supportTicket) throw new HttpError(404, "customer_not_found_for_ticket");
    return NextResponse.json({ customerId: supportTicket.customerId });
  } catch (err) {
    return handleError(err);
  }
}
