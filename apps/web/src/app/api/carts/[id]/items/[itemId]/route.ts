import { NextResponse } from "next/server";
import { getObject, updateObject } from "@/lib/bird/objects";
import type { BirdCart } from "@/lib/bird/types";
import { HttpError } from "@/lib/errors";
import { serializeCart } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

export async function DELETE(_req: Request, { params }: { params: { id: string; itemId: string } }) {
  try {
    const cart = await getObject<BirdCart>("carts", params.id);
    if (!cart) throw new HttpError(404, "cart_not_found");
    if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");

    const item = cart.items.find((i) => i.id === params.itemId);
    if (!item) throw new HttpError(404, "item_not_found");

    const items = cart.items.filter((i) => i.id !== params.itemId);
    const updated = await updateObject<BirdCart>("carts", cart.id, { items, lastActivityAt: new Date().toISOString() });
    if (!updated) throw new Error("cart_update_failed");

    return NextResponse.json(serializeCart(updated));
  } catch (err) {
    return handleError(err);
  }
}
