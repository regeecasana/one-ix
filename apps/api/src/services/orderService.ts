import type { Order as PrismaOrder } from "@prisma/client";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { computeSubtotalCents } from "./cartService";
import { etherealEmailProvider } from "../email/ethereal";
import { activationConfirmationEmail } from "../email/templates";
import { logInteraction } from "./interactionService";

export async function completeCheckout(cartId: string, voucherCode?: string): Promise<PrismaOrder> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: true } }, customer: true },
  });
  if (!cart) throw new HttpError(404, "cart_not_found");
  if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");
  if (!cart.customerId || !cart.customer) throw new HttpError(400, "setup_not_identified");
  if (cart.items.length === 0) throw new HttpError(400, "cart_is_empty");

  const subtotalCents = computeSubtotalCents(cart.items);

  let voucher = null;
  if (voucherCode) {
    voucher = await prisma.voucher.findUnique({ where: { code: voucherCode } });
    const isValid =
      voucher &&
      voucher.customerId === cart.customerId &&
      voucher.status === "active" &&
      voucher.expiresAt.getTime() > Date.now() &&
      cart.items.some((item) => item.productId === voucher!.productId);
    if (!isValid) throw new HttpError(400, "invalid_voucher");
  }

  const discountCents = voucher ? Math.round((subtotalCents * voucher.percentOff) / 100) : 0;
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
        voucherId: voucher?.id,
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

    if (voucher) {
      await tx.voucher.update({ where: { id: voucher.id }, data: { status: "redeemed" } });
    }

    return created;
  });

  const itemsSummary = cart.items.map((item) => item.product.name).join(", ");
  const detail = voucher
    ? `Activated ${itemsSummary} with voucher ${voucher.code} applied.`
    : `Activated ${itemsSummary}.`;
  await logInteraction(cart.customerId!, "activated", detail);

  const { subject, text } = activationConfirmationEmail({
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
    console.error("[email] failed to send activation confirmation", err);
  }

  return order;
}
