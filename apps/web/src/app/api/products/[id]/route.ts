import { NextResponse } from "next/server";
import { getObject } from "@/lib/bird/objects";
import type { BirdProduct } from "@/lib/bird/types";
import { HttpError } from "@/lib/errors";
import { serializeProduct } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const product = await getObject<BirdProduct>("products", params.id);
    if (!product) throw new HttpError(404, "product_not_found");
    return NextResponse.json(serializeProduct(product));
  } catch (err) {
    return handleError(err);
  }
}
