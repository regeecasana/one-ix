import type { Customer as PrismaCustomer } from "@prisma/client";
import { prisma } from "../db";
import { addTicketComment, createTicket } from "../zendesk/client";

export interface BufferedEvent {
  type: string;
  detail: string;
}

// The 30-second popup's submit handler runs through here: resolve (or
// create) the Customer by email, open their activity ticket if they don't
// already have one, and flush whatever they did in the anonymous window
// before this moment as catch-up comments, in order.
export async function identifyCustomer(
  email: string,
  params: { name?: string; cartId?: string; bufferedEvents?: BufferedEvent[] } = {}
): Promise<PrismaCustomer> {
  let customer = await prisma.customer.upsert({
    where: { email },
    update: params.name ? { name: params.name } : {},
    create: { email, name: params.name },
  });

  if (!customer.activeTicketId) {
    const ticketId = await createTicket({
      requesterEmail: email,
      subject: `Activity — ${email}`,
      body: "New session started.",
      customerId: customer.id,
    });
    if (ticketId) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { activeTicketId: ticketId },
      });
    }
  }

  if (params.cartId) {
    await prisma.cart.updateMany({
      where: { id: params.cartId, status: "active" },
      data: { customerId: customer.id, lastActivityAt: new Date() },
    });
  }

  for (const evt of params.bufferedEvents ?? []) {
    await prisma.interactionEvent.create({
      data: { customerId: customer.id, type: evt.type, detail: evt.detail },
    });
    if (customer.activeTicketId) {
      await addTicketComment(customer.activeTicketId, evt.detail);
    }
  }

  return customer;
}
