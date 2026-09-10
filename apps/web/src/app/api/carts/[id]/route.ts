import { NextResponse } from "next/server";
import { getObject, searchObjects, updateObject } from "@/lib/bird/objects";
import type { BirdCart, BirdCartItem } from "@/lib/bird/types";
import { HttpError } from "@/lib/errors";
import { serializeCart } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

function getCartItems(cartId: string) {
  return searchObjects<BirdCartItem>("cartItems", [{ attribute: "cartId", operator: "string/equals", value: cartId }]);
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const cart = await getObject<BirdCart>("carts", params.id);
    if (!cart) throw new HttpError(404, "cart_not_found");
    const items = await getCartItems(cart.id);
    return NextResponse.json(serializeCart(cart, items));
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const cart = await getObject<BirdCart>("carts", params.id);
    if (!cart) throw new HttpError(404, "cart_not_found");
    if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");

    const updated = await updateObject<BirdCart>("carts", cart.id, {
      recommendationReason: body?.recommendationReason ? String(body.recommendationReason) : cart.recommendationReason,
      lastActivityAt: new Date().toISOString(),
    });
    if (!updated) throw new Error("cart_update_failed");

    const items = await getCartItems(updated.id);
    return NextResponse.json(serializeCart(updated, items));
  } catch (err) {
    return handleError(err);
  }
}
