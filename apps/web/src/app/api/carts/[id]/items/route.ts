import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { serializeCart } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const cart = await prisma.cart.findUnique({ where: { id: params.id } });
    if (!cart) throw new HttpError(404, "cart_not_found");
    if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");

    const productId = String(body?.productId ?? "");
    const quantity = Number(body?.quantity);
    if (!productId) throw new HttpError(400, "product_id_required");
    if (!Number.isInteger(quantity) || quantity < 1) throw new HttpError(400, "invalid_quantity");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new HttpError(404, "product_not_found");

    const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId } });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity, unitPriceCents: product.priceCents },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity, unitPriceCents: product.priceCents },
      });
    }

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
