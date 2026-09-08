import { NextResponse } from "next/server";
import { getObject, updateObject } from "@/lib/bird/objects";
import type { BirdCart, BirdProduct } from "@/lib/bird/types";
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

    const product = await getObject<BirdProduct>("products", productId);
    if (!product) throw new HttpError(404, "product_not_found");

    const existing = cart.items.find((i) => i.productId === productId);
    const items = existing
      ? cart.items.map((i) => (i.productId === productId ? { ...i, quantity, unitPriceCents: product.priceCents } : i))
      : [...cart.items, { id: crypto.randomUUID(), productId, quantity, unitPriceCents: product.priceCents }];

    const updated = await updateObject<BirdCart>("carts", cart.id, { items, lastActivityAt: new Date().toISOString() });
    if (!updated) throw new Error("cart_update_failed");

    return NextResponse.json(serializeCart(updated));
  } catch (err) {
    return handleError(err);
  }
}
