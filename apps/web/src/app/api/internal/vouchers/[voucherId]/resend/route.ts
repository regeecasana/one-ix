import { NextResponse } from "next/server";
import { resendVoucher } from "@/lib/services/voucherService";
import { serializeVoucher } from "@/lib/serializers";
import { requireInternalAuth, handleError } from "@/lib/apiHelpers";

export async function POST(req: Request, { params }: { params: { voucherId: string } }) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const voucher = await resendVoucher(params.voucherId, body?.ttlMinutes ? Number(body.ttlMinutes) : undefined);
    return NextResponse.json(serializeVoucher(voucher));
  } catch (err) {
    return handleError(err);
  }
}
