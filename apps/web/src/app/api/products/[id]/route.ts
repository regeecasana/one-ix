import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { serializeProduct } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({ where: { id: params.id } });
    if (!product) throw new HttpError(404, "product_not_found");
    return NextResponse.json(serializeProduct(product));
  } catch (err) {
    return handleError(err);
  }
}
