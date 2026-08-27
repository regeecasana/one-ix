import type { Customer as PrismaCustomer } from "@prisma/client";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { etherealEmailProvider } from "../email/ethereal";
import { goodwillPointsEmail } from "../email/templates";
import { addTicketComment } from "../zendesk/client";

// The one agent-facing action the sidebar app hinges on -- see
// docs/zendesk-app.md. Always an explicit, optional action, never automatic.
export async function grantGoodwillPoints(params: {
  customerId: string;
  amount: number;
  reason: string;
  zendeskTicketId?: string | null;
}): Promise<PrismaCustomer> {
  if (!Number.isInteger(params.amount) || params.amount <= 0) {
    throw new HttpError(400, "invalid_amount");
  }

  const customer = await prisma.customer.update({
    where: { id: params.customerId },
    data: { pointsBalance: { increment: params.amount } },
  });

  const { subject, text } = goodwillPointsEmail({
    amount: params.amount,
    reason: params.reason,
    newBalance: customer.pointsBalance,
  });

  try {
    await etherealEmailProvider.send({ to: customer.email, subject, text });
  } catch (err) {
    console.error("[email] failed to send goodwill points notice", err);
  }

  if (params.zendeskTicketId) {
    await addTicketComment(
      params.zendeskTicketId,
      `Granted ${params.amount.toLocaleString()} goodwill XL points: ${params.reason}`
    );
  }

  return customer;
}
