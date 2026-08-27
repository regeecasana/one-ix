import type { Voucher as PrismaVoucher } from "@prisma/client";
import { prisma } from "../db";
import { env } from "../env";
import { HttpError } from "../errors";
import { generateVoucherCode } from "../voucherCode";
import { etherealEmailProvider } from "../email/ethereal";
import { voucherEmail } from "../email/templates";
import { addTicketComment } from "../zendesk/client";

// The agent's one-click recovery action -- see docs/user-stories.md.
// Always explicit, never automatic.
export async function issueVoucher(params: {
  customerId: string;
  productId: string;
  percentOff?: number;
  ttlMinutes?: number;
}): Promise<PrismaVoucher> {
  const customer = await prisma.customer.findUnique({ where: { id: params.customerId } });
  if (!customer) throw new HttpError(404, "customer_not_found");
  const product = await prisma.product.findUnique({ where: { id: params.productId } });
  if (!product) throw new HttpError(404, "product_not_found");

  const percentOff = params.percentOff ?? 20;
  const ttlMinutes = params.ttlMinutes ?? env.voucherTtlMinutes;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
  const code = generateVoucherCode(percentOff);

  const voucher = await prisma.$transaction(async (tx) => {
    // At most one active voucher per customer+product at a time.
    await tx.voucher.updateMany({
      where: { customerId: customer.id, productId: product.id, status: "active" },
      data: { status: "expired" },
    });
    return tx.voucher.create({
      data: {
        code,
        customerId: customer.id,
        productId: product.id,
        percentOff,
        expiresAt,
        issuedBy: "agent",
        zendeskTicketId: customer.activeTicketId,
      },
    });
  });

  const { subject, text } = voucherEmail({ productName: product.name, code, percentOff, expiresAt });
  try {
    await etherealEmailProvider.send({ to: customer.email, subject, text });
  } catch (err) {
    console.error("[email] failed to send voucher email", err);
  }

  if (customer.activeTicketId) {
    await addTicketComment(
      customer.activeTicketId,
      `Agent sent a ${percentOff}% voucher (${code}) for ${product.name}, expires ${expiresAt.toISOString()}.`
    );
  }

  return voucher;
}

// "Checked back the next day" -- see docs/zendesk-app.md.
export async function resendVoucher(voucherId: string, ttlMinutes?: number): Promise<PrismaVoucher> {
  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
    include: { customer: true, product: true },
  });
  if (!voucher) throw new HttpError(404, "voucher_not_found");
  // A redeemed voucher was already spent on a real order -- resending it
  // would let the same code be applied to a second checkout for free.
  if (voucher.status === "redeemed") throw new HttpError(409, "voucher_already_redeemed");

  const expiresAt = new Date(Date.now() + (ttlMinutes ?? env.voucherTtlMinutes) * 60_000);
  const updated = await prisma.voucher.update({
    where: { id: voucher.id },
    data: { status: "active", expiresAt, resendCount: { increment: 1 } },
  });

  const { subject, text } = voucherEmail({
    productName: voucher.product.name,
    code: voucher.code,
    percentOff: voucher.percentOff,
    expiresAt,
  });
  try {
    await etherealEmailProvider.send({ to: voucher.customer.email, subject, text });
  } catch (err) {
    console.error("[email] failed to resend voucher email", err);
  }

  const ticketId = voucher.zendeskTicketId ?? voucher.customer.activeTicketId;
  if (ticketId) {
    await addTicketComment(
      ticketId,
      `Agent resent the voucher (${voucher.code}), extended to expire ${expiresAt.toISOString()}.`
    );
  }

  return updated;
}
