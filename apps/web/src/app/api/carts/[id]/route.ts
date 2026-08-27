import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { serializeCart } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const cart = await prisma.cart.findUnique({ where: { id: params.id }, include: { items: true } });
    if (!cart) throw new HttpError(404, "cart_not_found");
    return NextResponse.json(serializeCart(cart));
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const cart = await prisma.cart.findUnique({ where: { id: params.id } });
    if (!cart) throw new HttpError(404, "cart_not_found");
    if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");

    const updated = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        recommendationReason: body?.recommendationReason ? String(body.recommendationReason) : cart.recommendationReason,
        lastActivityAt: new Date(),
      },
      include: { items: true },
    });

    return NextResponse.json(serializeCart(updated));
  } catch (err) {
    return handleError(err);
  }
}
