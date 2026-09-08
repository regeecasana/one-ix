import { env } from "../env";
import { HttpError } from "../errors";
import { generateVoucherCode } from "../voucherCode";
import { etherealEmailProvider } from "../email/ethereal";
import { voucherEmail } from "../email/templates";
import { addTicketComment } from "../zendesk/client";
import { getContactById } from "../bird/client";
import { createObject, getObject, searchObjects, updateObject } from "../bird/objects";
import type { BirdProduct, BirdVoucher } from "../bird/types";

// The agent's one-click recovery action -- see docs/user-stories.md.
// Always explicit, never automatic. "At most one active voucher per
// customer+product" was previously enforced inside a prisma.$transaction;
// Bird's Custom Objects have no confirmed cross-record transaction (see
// docs/architecture.md), so this is search-then-update-then-create instead
// -- a small window where two concurrent calls could both pass the search
// before either writes, an accepted trade-off at this app's traffic level.
export async function issueVoucher(params: {
  customerId: string;
  productId: string;
  percentOff?: number;
  ttlMinutes?: number;
}): Promise<BirdVoucher> {
  const customer = await getContactById(params.customerId);
  if (!customer) throw new HttpError(404, "customer_not_found");
  const product = await getObject<BirdProduct>("products", params.productId);
  if (!product) throw new HttpError(404, "product_not_found");

  const percentOff = params.percentOff ?? 20;
  const ttlMinutes = params.ttlMinutes ?? env.voucherTtlMinutes;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
  const code = generateVoucherCode(percentOff);

  const activeVouchers = await searchObjects<BirdVoucher>("vouchers", [
    { attribute: "customerId", operator: "string/equals", value: customer.id },
    { attribute: "productId", operator: "string/equals", value: product.id },
    { attribute: "status", operator: "string/equals", value: "active" },
  ]);
  for (const v of activeVouchers) {
    await updateObject<BirdVoucher>("vouchers", v.id, { status: "expired" });
  }

  const voucher = await createObject<BirdVoucher>("vouchers", {
    code,
    customerId: customer.id,
    productId: product.id,
    percentOff,
    status: "active",
    expiresAt: expiresAt.toISOString(),
    issuedBy: "agent",
    resendCount: 0,
    zendeskTicketId: customer.activeTicketId,
    createdAt: new Date().toISOString(),
  });
  if (!voucher) throw new HttpError(502, "voucher_creation_failed");

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
export async function resendVoucher(voucherId: string, ttlMinutes?: number): Promise<BirdVoucher> {
  const voucher = await getObject<BirdVoucher>("vouchers", voucherId);
  if (!voucher) throw new HttpError(404, "voucher_not_found");
  // A redeemed voucher was already spent on a real order -- resending it
  // would let the same code be applied to a second checkout for free.
  if (voucher.status === "redeemed") throw new HttpError(409, "voucher_already_redeemed");

  const [customer, product] = await Promise.all([
    getContactById(voucher.customerId),
    getObject<BirdProduct>("products", voucher.productId),
  ]);
  if (!customer) throw new HttpError(404, "customer_not_found");
  if (!product) throw new HttpError(404, "product_not_found");

  const expiresAt = new Date(Date.now() + (ttlMinutes ?? env.voucherTtlMinutes) * 60_000);
  const updated = await updateObject<BirdVoucher>("vouchers", voucher.id, {
    status: "active",
    expiresAt: expiresAt.toISOString(),
    resendCount: voucher.resendCount + 1,
  });
  if (!updated) throw new HttpError(502, "voucher_update_failed");

  const { subject, text } = voucherEmail({
    productName: product.name,
    code: voucher.code,
    percentOff: voucher.percentOff,
    expiresAt,
  });
  try {
    await etherealEmailProvider.send({ to: customer.email, subject, text });
  } catch (err) {
    console.error("[email] failed to resend voucher email", err);
  }

  const ticketId = voucher.zendeskTicketId ?? customer.activeTicketId;
  if (ticketId) {
    await addTicketComment(
      ticketId,
      `Agent resent the voucher (${voucher.code}), extended to expire ${expiresAt.toISOString()}.`
    );
  }

  return updated;
}
