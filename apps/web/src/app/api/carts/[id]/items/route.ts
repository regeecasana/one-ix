import { NextResponse } from "next/server";
import { createObject, getObject, getProductBySlug, searchObjects, updateObject } from "@/lib/bird/objects";
import type { BirdCart, BirdCartItem } from "@/lib/bird/types";
import { HttpError } from "@/lib/errors";
import { serializeCart } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const cart = await getObject<BirdCart>("carts", params.id);
    if (!cart) throw new HttpError(404, "cart_not_found");
    if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");

    const productId = String(body?.productId ?? "");
    const quantity = Number(body?.quantity);
    if (!productId) throw new HttpError(400, "product_id_required");
    if (!Number.isInteger(quantity) || quantity < 1) throw new HttpError(400, "invalid_quantity");

    const product = await getProductBySlug(productId);
    if (!product) throw new HttpError(404, "product_not_found");

    const existing = await searchObjects<BirdCartItem>("cartItems", [
      { attribute: "cartId", operator: "string/equals", value: cart.id },
      { attribute: "productId", operator: "string/equals", value: productId },
    ]);
    if (existing[0]) {
      await updateObject<BirdCartItem>("cartItems", existing[0].id, { quantity, unitPriceCents: product.priceCents });
    } else {
      await createObject<BirdCartItem>("cartItems", {
        cartId: cart.id,
        productId,
        quantity,
        unitPriceCents: product.priceCents,
      });
    }

    const updatedCart = await updateObject<BirdCart>("carts", cart.id, { lastActivityAt: new Date().toISOString() });
    if (!updatedCart) throw new Error("cart_update_failed");

    const items = await searchObjects<BirdCartItem>("cartItems", [
      { attribute: "cartId", operator: "string/equals", value: cart.id },
    ]);
    return NextResponse.json(serializeCart(updatedCart, items));
  } catch (err) {
    return handleError(err);
  }
}
