import type { Order as PrismaOrder } from "@prisma/client";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { computeSubtotalCents } from "./cartService";
import { etherealEmailProvider } from "../email/ethereal";
import { activationConfirmationEmail } from "../email/templates";

// Awarded only if this activation follows a CDP nudge (Cart.remindedAt is
// set) -- the base 5,000 for OTP consent was already granted at "save my
// setup" time, in identityService.ts. See docs/data-model.md invariants.
const NUDGE_COMPLETION_BONUS_POINTS = 5000;

export async function completeCheckout(cartId: string): Promise<PrismaOrder> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true } }, customer: true },
  });
  if (!cart) throw new HttpError(404, "cart_not_found");
  if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");
  if (!cart.customerId || !cart.customer) throw new HttpError(400, "setup_not_saved");
  if (cart.items.length === 0) throw new HttpError(400, "cart_is_empty");

  const subtotalCents = computeSubtotalCents(cart.items);
  const pointsEarned = cart.remindedAt ? NUDGE_COMPLETION_BONUS_POINTS : 0;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        cartId: cart.id,
        customerId: cart.customerId!,
        status: "paid",
        subtotalCents,
        totalCents: subtotalCents,
        pointsEarned,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          })),
        },
      },
    });

    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cart.update({ where: { id: cart.id }, data: { status: "converted" } });

    if (pointsEarned > 0) {
      await tx.customer.update({
        where: { id: cart.customerId! },
        data: { pointsBalance: { increment: pointsEarned } },
      });
    }

    return created;
  });

  const { subject, text } = activationConfirmationEmail({
    orderId: order.id,
    items: cart.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
    subtotalCents,
    totalCents: subtotalCents,
    pointsEarned,
  });

  try {
    await etherealEmailProvider.send({ to: cart.customer.email, subject, text });
  } catch (err) {
    console.error("[email] failed to send activation confirmation", err);
  }

  return order;
}
