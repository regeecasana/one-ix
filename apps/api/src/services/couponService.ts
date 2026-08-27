import type { Coupon as PrismaCoupon } from "@prisma/client";
import { prisma } from "../db";
import { env } from "../env";
import { HttpError } from "../errors";
import { generateCouponCode } from "../couponCode";
import { etherealEmailProvider } from "../email/ethereal";
import { couponEmail } from "../email/templates";
import { addTicketComment } from "../zendesk/client";

export async function issueCouponForCart(params: {
  cartId: string;
  percentOff?: number;
  ttlMinutes?: number;
  zendeskTicketId?: string | null;
}): Promise<PrismaCoupon> {
  const cart = await prisma.cart.findUnique({
    where: { id: params.cartId },
    include: { items: { include: { product: true } }, customer: true },
  });
  if (!cart) throw new HttpError(404, "cart_not_found");
  if (!cart.customer) throw new HttpError(400, "cart_has_no_customer");
  if (cart.items.length === 0) throw new HttpError(400, "cart_is_empty");

  const percentOff = params.percentOff ?? 20;
  const ttlMinutes = params.ttlMinutes ?? env.couponTtlMinutes;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
  const code = generateCouponCode(percentOff);

  // Issuance is always an explicit agent action (see docs/data-model.md
  // invariants) -- this service has no "system" caller.
  const coupon = await prisma.$transaction(async (tx) => {
    // At most one active coupon per cart at a time.
    await tx.coupon.updateMany({
      where: { cartId: cart.id, status: "active" },
      data: { status: "expired" },
    });
    return tx.coupon.create({
      data: {
        code,
        cartId: cart.id,
        percentOff,
        status: "active",
        expiresAt,
        issuedBy: "agent",
        zendeskTicketId: params.zendeskTicketId ?? null,
      },
    });
  });

  await prisma.abandonedCartEvent.updateMany({
    where: { cartId: cart.id, status: { in: ["detected", "ticket_created"] } },
    data: { status: "coupon_sent" },
  });

  const primaryItem = cart.items[0];
  const { subject, text } = couponEmail({
    productName: primaryItem.product.name,
    code: coupon.code,
    percentOff,
    expiresAt,
    cartId: cart.id,
  });

  try {
    await etherealEmailProvider.send({ to: cart.customer.email, subject, text });
  } catch (err) {
    // The coupon is already issued -- a failed send shouldn't undo that.
    console.error("[email] failed to send coupon email", err);
  }

  if (params.zendeskTicketId) {
    await addTicketComment(
      params.zendeskTicketId,
      `Issued a ${percentOff}% coupon (${coupon.code}) for cart ${cart.id}, expires ${expiresAt.toISOString()}.`
    );
  }

  return coupon;
}
