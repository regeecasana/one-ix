import { addTicketComment, createTicket, getTicketStatus } from "../zendesk/client";
import { trackEvent, upsertContact, type BirdContact } from "../bird/client";
import { createObject, getObject, updateObject } from "../bird/objects";
import type { BirdActivityTicket, BirdCart } from "../bird/types";

export interface BufferedEvent {
  type: string;
  detail: string;
}

// The 30-second popup's submit handler runs through here: resolve (or
// create) the Customer by email, open their activity ticket if they don't
// already have one, and flush whatever they did in the anonymous window
// before this moment as catch-up comments, in order. Customer identity
// lives in Bird as a Contact (see docs/architecture.md) -- the Bird
// contact's own `id` is what every other object (carts, orders, vouchers,
// support tickets) stores as `customerId`.
export async function identifyCustomer(
  email: string,
  params: { name?: string; cartId?: string; bufferedEvents?: BufferedEvent[] } = {}
): Promise<BirdContact> {
  let customer = await upsertContact({ email, name: params.name });
  if (!customer) throw new Error(`[identify] failed to upsert Bird contact for ${email}`);

  // A closed ticket is done -- Zendesk won't take further comments on it,
  // and a returning customer with a new issue shouldn't get lumped into
  // old, resolved history anyway. Start a fresh one instead of reusing it.
  if (customer.activeTicketId) {
    const status = await getTicketStatus(customer.activeTicketId);
    if (status === "closed") {
      console.log(`[identify] ${email}'s ticket ${customer.activeTicketId} is closed -- starting a new one`);
      customer = (await upsertContact({ email, activeTicketId: null })) ?? customer;
    }
  }

  if (!customer.activeTicketId) {
    console.log(`[identify] ${email} has no activeTicketId -- creating a new ticket`);
    const ticketId = await createTicket({
      requesterEmail: email,
      requesterName: customer.name ?? undefined,
      subject: `Activity — ${email}`,
      body: customer.name ? `New Session Started for ${customer.name} (${email})` : `New Session Started for ${email}`,
      customerId: customer.id,
      tags: ["activity_session", "auto_created"],
    });
    if (ticketId) {
      customer = (await upsertContact({ email, activeTicketId: ticketId })) ?? customer;
      await createObject<BirdActivityTicket>("activityTickets", {
        ticketId,
        customerId: customer.id,
        createdAt: new Date().toISOString(),
      });
    }
  } else {
    console.log(
      `[identify] ${email} already has activeTicketId=${customer.activeTicketId} -- reusing it, no new ticket created`
    );
  }

  if (params.cartId) {
    const cart = await getObject<BirdCart>("carts", params.cartId);
    if (cart && cart.status === "active") {
      await updateObject<BirdCart>("carts", cart.id, {
        customerId: customer.id,
        lastActivityAt: new Date().toISOString(),
      });
    }
  }

  for (const evt of params.bufferedEvents ?? []) {
    await trackEvent({ contactId: customer.id, eventName: evt.type, properties: { detail: evt.detail } });
    if (customer.activeTicketId) {
      await addTicketComment(customer.activeTicketId, evt.detail);
    }
  }

  return customer;
}
