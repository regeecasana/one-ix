import { buildCustomerProfile, profileToTicketContext } from "./profileService";
import { createTicket } from "../zendesk/client";
import { upsertContact } from "../bird/client";
import { createObject } from "../bird/objects";
import type { BirdSupportTicket } from "../bird/types";

// A standalone contact-support flow, separate from the per-customer
// activity ticket the email popup creates -- not yet reconciled with it
// (see docs/api-spec.md). Identity resolution here is find-or-create by
// email only; someone can contact support without ever going through the
// builder.
export async function submitSupportTicket(params: {
  email: string;
  subject: string;
  message: string;
}): Promise<BirdSupportTicket> {
  const customer = await upsertContact({ email: params.email });
  if (!customer) throw new Error(`[support] failed to upsert Bird contact for ${params.email}`);

  const profile = await buildCustomerProfile(customer.id);
  const body = [params.message, ``, `--- Unified Profile ---`, profileToTicketContext(profile)].join("\n");

  const zendeskTicketId = await createTicket({
    requesterEmail: params.email,
    subject: params.subject,
    body,
    customerId: customer.id,
    tags: ["customer_submitted", "contact_form"],
  });

  const ticket = await createObject<BirdSupportTicket>("support_tickets", {
    customerId: customer.id,
    zendeskTicketId,
    subject: params.subject,
    message: params.message,
    createdAt: new Date().toISOString(),
  });
  if (!ticket) throw new Error(`[support] failed to create support ticket object for ${params.email}`);
  return ticket;
}
