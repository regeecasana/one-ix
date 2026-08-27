import { prisma } from "../db";

// Physically flips the status column for the ticket/audit trail. Not the
// source of truth for "is this coupon still good" -- that's checked live
// against expiresAt wherever a coupon is read (see docs/api-spec.md).
export async function runCouponExpirySweep(): Promise<{ expired: number }> {
  const now = new Date();
  const expired = await prisma.coupon.findMany({
    where: { status: "active", expiresAt: { lt: now } },
  });

  for (const coupon of expired) {
    await prisma.coupon.update({ where: { id: coupon.id }, data: { status: "expired" } });
    await prisma.abandonedCartEvent.updateMany({
      where: { cartId: coupon.cartId, status: "coupon_sent" },
      data: { status: "expired_unused" },
    });
  }

  return { expired: expired.length };
}
