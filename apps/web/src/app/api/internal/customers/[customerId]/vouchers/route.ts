import { NextResponse } from "next/server";
import { HttpError } from "@/lib/errors";
import { issueVoucher } from "@/lib/services/voucherService";
import { serializeVoucher } from "@/lib/serializers";
import { requireInternalAuth, handleError } from "@/lib/apiHelpers";

export async function POST(req: Request, { params }: { params: { customerId: string } }) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const productId = String(body?.productId ?? "");
    if (!productId) throw new HttpError(400, "product_id_required");

    const voucher = await issueVoucher({
      customerId: params.customerId,
      productId,
      percentOff: body?.percentOff ? Number(body.percentOff) : undefined,
      ttlMinutes: body?.ttlMinutes ? Number(body.ttlMinutes) : undefined,
    });

    return NextResponse.json(serializeVoucher(voucher), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
