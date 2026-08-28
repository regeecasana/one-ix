import type { Customer as PrismaCustomer } from "@prisma/client";
import { prisma } from "../db";
import { addTicketComment, createTicket, getTicketStatus } from "../zendesk/client";

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

  // A closed ticket is done -- Zendesk won't take further comments on it,
  // and a returning customer with a new issue shouldn't get lumped into
  // old, resolved history anyway. Start a fresh one instead of reusing it.
  if (customer.activeTicketId) {
    const status = await getTicketStatus(customer.activeTicketId);
    if (status === "closed") {
      console.log(`[identify] ${email}'s ticket ${customer.activeTicketId} is closed -- starting a new one`);
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { activeTicketId: null },
      });
    }
  }

  if (!customer.activeTicketId) {
    console.log(`[identify] ${email} has no activeTicketId -- creating a new ticket`);
    const ticketId = await createTicket({
      requesterEmail: email,
      subject: `Activity — ${email}`,
      body: customer.name ? `New Session Started for ${customer.name} (${email})` : `New Session Started for ${email}`,
      customerId: customer.id,
      tags: ["activity_session", "auto_created"],
    });
    if (ticketId) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { activeTicketId: ticketId },
      });
    }
  } else {
    console.log(
      `[identify] ${email} already has activeTicketId=${customer.activeTicketId} -- reusing it, no new ticket created`
    );
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
