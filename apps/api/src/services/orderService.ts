import type { Order as PrismaOrder } from "@prisma/client";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { computeSubtotalCents } from "./cartService";
import { etherealEmailProvider } from "../email/ethereal";
import { orderConfirmationEmail } from "../email/templates";
import { addTicketComment } from "../zendesk/client";

export async function completeCheckout(cartId: string, couponCode?: string): Promise<PrismaOrder> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true } }, customer: true },
  });
  if (!cart) throw new HttpError(404, "cart_not_found");
  if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");
  if (!cart.customerId || !cart.customer) throw new HttpError(400, "checkout_not_started");
  if (cart.items.length === 0) throw new HttpError(400, "cart_is_empty");

  const subtotalCents = computeSubtotalCents(cart.items);

  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    const isValid =
      coupon &&
      coupon.cartId === cart.id &&
      coupon.status === "active" &&
      coupon.expiresAt.getTime() > Date.now();
    if (!isValid) throw new HttpError(400, "invalid_coupon");
  }

  const discountCents = coupon ? Math.round((subtotalCents * coupon.percentOff) / 100) : 0;
  const totalCents = subtotalCents - discountCents;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        cartId: cart.id,
        customerId: cart.customerId!,
        status: "paid",
        subtotalCents,
        discountCents,
        totalCents,
        couponId: coupon?.id,
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

    if (coupon) {
      await tx.coupon.update({ where: { id: coupon.id }, data: { status: "redeemed" } });
    }

    return created;
  });

  const event = await prisma.abandonedCartEvent.findFirst({ where: { cartId: cart.id } });
  if (event) {
    await prisma.abandonedCartEvent.update({ where: { id: event.id }, data: { status: "recovered" } });
    if (event.zendeskTicketId) {
      await addTicketComment(
        event.zendeskTicketId,
        `Order ${order.id} placed -- cart recovered ($${(totalCents / 100).toFixed(2)}).`
      );
    }
  }

  const { subject, text } = orderConfirmationEmail({
    orderId: order.id,
    items: cart.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
    subtotalCents,
    discountCents,
    totalCents,
  });

  try {
    await etherealEmailProvider.send({ to: cart.customer.email, subject, text });
  } catch (err) {
    console.error("[email] failed to send order confirmation", err);
  }

  return order;
}
