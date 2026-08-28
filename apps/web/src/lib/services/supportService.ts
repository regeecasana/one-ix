import type { SupportTicket as PrismaSupportTicket } from "@prisma/client";
import { prisma } from "../db";
import { buildCustomerProfile, profileToTicketContext } from "./profileService";
import { createTicket } from "../zendesk/client";

// A standalone contact-support flow, separate from the per-customer
// activity ticket the email popup creates -- not yet reconciled with it
// (see docs/api-spec.md). Identity resolution here is find-or-create by
// email only; someone can contact support without ever going through the
// builder.
export async function submitSupportTicket(params: {
  email: string;
  subject: string;
  message: string;
}): Promise<PrismaSupportTicket> {
  const customer = await prisma.customer.upsert({
    where: { email: params.email },
    update: {},
    create: { email: params.email },
  });

  const profile = await buildCustomerProfile(customer.id);
  const body = [params.message, ``, `--- Unified Profile ---`, profileToTicketContext(profile)].join("\n");

  const zendeskTicketId = await createTicket({
    requesterEmail: params.email,
    subject: params.subject,
    body,
    customerId: customer.id,
    tags: ["customer_submitted", "contact_form"],
  });

  return prisma.supportTicket.create({
    data: {
      customerId: customer.id,
      zendeskTicketId,
      subject: params.subject,
      message: params.message,
    },
  });
}
