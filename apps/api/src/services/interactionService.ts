import type { InteractionEvent as PrismaInteractionEvent } from "@prisma/client";
import { prisma } from "../db";
import { addTicketComment } from "../zendesk/client";

// Every "Ravta did X" beat in docs/user-stories.md runs through here:
// persist locally (the source of truth) and mirror to the customer's
// active ticket as a comment (what the agent actually reads).
export async function logInteraction(
  customerId: string,
  type: string,
  detail: string
): Promise<PrismaInteractionEvent> {
  const event = await prisma.interactionEvent.create({ data: { customerId, type, detail } });

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (customer?.activeTicketId) {
    await addTicketComment(customer.activeTicketId, detail);
  }

  return event;
}
