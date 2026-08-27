import { prisma } from "../db";
import { env } from "../env";
import { createAbandonedCartTicket } from "../zendesk/client";

// "Started checkout" is signaled by customerId being set (checkout/start
// captures the email) -- see docs/data-model.md. No separate timestamp
// field for it.
export async function runAbandonedCartSweep(): Promise<{ flagged: number; checkedAt: string }> {
  const cutoff = new Date(Date.now() - env.abandonThresholdMs);

  const candidates = await prisma.cart.findMany({
    where: {
      status: "active",
      customerId: { not: null },
      lastActivityAt: { lt: cutoff },
    },
    include: { items: { include: { product: true } }, customer: true },
  });

  let flagged = 0;

  for (const cart of candidates) {
    if (cart.items.length === 0 || !cart.customer) continue;

    await prisma.cart.update({ where: { id: cart.id }, data: { status: "abandoned" } });
    const event = await prisma.abandonedCartEvent.create({ data: { cartId: cart.id, status: "detected" } });

    const primaryItem = cart.items[0];
    const subject = `Abandoned cart — ${primaryItem.product.name}`;
    const itemLines = cart.items.map((item) => `- ${item.quantity} x ${item.product.name}`).join("\n");
    const body = [
      `A cart was abandoned after starting checkout.`,
      ``,
      `Customer: ${cart.customer.email}`,
      `Cart: ${cart.id}`,
      ``,
      itemLines,
    ].join("\n");

    const ticketId = await createAbandonedCartTicket({
      requesterEmail: cart.customer.email,
      subject,
      body,
      cartId: cart.id,
    });

    await prisma.abandonedCartEvent.update({
      where: { id: event.id },
      data: { zendeskTicketId: ticketId, status: ticketId ? "ticket_created" : "detected" },
    });

    flagged += 1;
  }

  return { flagged, checkedAt: new Date().toISOString() };
}
