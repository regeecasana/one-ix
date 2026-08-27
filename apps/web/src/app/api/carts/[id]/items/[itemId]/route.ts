import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { serializeCart } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

export async function DELETE(_req: Request, { params }: { params: { id: string; itemId: string } }) {
  try {
    const cart = await prisma.cart.findUnique({ where: { id: params.id } });
    if (!cart) throw new HttpError(404, "cart_not_found");
    if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");

    const item = await prisma.cartItem.findFirst({ where: { id: params.itemId, cartId: cart.id } });
    if (!item) throw new HttpError(404, "item_not_found");

    await prisma.cartItem.delete({ where: { id: item.id } });

    const updated = await prisma.cart.update({
      where: { id: cart.id },
      data: { lastActivityAt: new Date() },
      include: { items: true },
    });

    return NextResponse.json(serializeCart(updated));
  } catch (err) {
    return handleError(err);
  }
}
