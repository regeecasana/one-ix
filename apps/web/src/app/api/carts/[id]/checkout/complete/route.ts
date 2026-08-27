import { NextResponse } from "next/server";
import { completeCheckout } from "@/lib/services/orderService";
import { serializeOrder } from "@/lib/serializers";
import { handleError } from "@/lib/apiHelpers";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const voucherCode = body?.voucherCode ? String(body.voucherCode) : undefined;
    const order = await completeCheckout(params.id, voucherCode);
    return NextResponse.json(serializeOrder(order), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
