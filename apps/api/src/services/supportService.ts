import type { SupportTicket as PrismaSupportTicket } from "@prisma/client";
import { prisma } from "../db";
import { buildCustomerProfile, profileToTicketContext } from "./profileService";
import { createTicket } from "../zendesk/client";

// Ravta's proactive contact (Act 2) -- independent of the CDP nudge (Act 1).
// Identity resolution here is find-or-create by email only; someone can
// contact support without ever having gone through the builder/OTP flow.
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
