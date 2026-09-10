import { NextResponse } from "next/server";
import { deleteObject, getObject, searchObjects, updateObject } from "@/lib/bird/objects";
import type { BirdCart, BirdCartItem } from "@/lib/bird/types";
import { HttpError } from "@/lib/errors";
import { serializeCart } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

export async function DELETE(_req: Request, { params }: { params: { id: string; itemId: string } }) {
  try {
    const cart = await getObject<BirdCart>("carts", params.id);
    if (!cart) throw new HttpError(404, "cart_not_found");
    if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");

    const item = await getObject<BirdCartItem>("cartItems", params.itemId);
    if (!item || item.cartId !== cart.id) throw new HttpError(404, "item_not_found");

    await deleteObject("cartItems", item.id);

    const updated = await updateObject<BirdCart>("carts", cart.id, { lastActivityAt: new Date().toISOString() });
    if (!updated) throw new Error("cart_update_failed");

    const items = await searchObjects<BirdCartItem>("cartItems", [
      { attribute: "cartId", operator: "string/equals", value: cart.id },
    ]);
    return NextResponse.json(serializeCart(updated, items));
  } catch (err) {
    return handleError(err);
  }
}
