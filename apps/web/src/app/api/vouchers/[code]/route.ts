import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { serializeVoucher } from "@/lib/serializers";
import { checkRateLimit, rateLimitResponse, handleError } from "@/lib/apiHelpers";

// A voucher code alone is only ~48 bits of entropy -- require both ids and
// rate-limit so this can't be used as a bare enumeration oracle (same
// reasoning as the earlier coupon-validation endpoint it replaces).
export async function GET(req: Request, { params }: { params: { code: string } }) {
  try {
    if (!checkRateLimit(req, "validate-voucher", 20, 60_000)) return rateLimitResponse();

    const url = new URL(req.url);
    const customerId = url.searchParams.get("customerId") ?? "";
    const productId = url.searchParams.get("productId") ?? "";
    if (!customerId || !productId) throw new HttpError(400, "customer_and_product_required");

    const voucher = await prisma.voucher.findUnique({ where: { code: params.code } });

    if (!voucher || voucher.customerId !== customerId || voucher.productId !== productId) {
      return NextResponse.json({ valid: false, reason: "not_found" });
    }
    if (voucher.status !== "active" || voucher.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ valid: false, reason: voucher.status === "redeemed" ? "redeemed" : "expired" });
    }

    return NextResponse.json({ valid: true, voucher: serializeVoucher(voucher) });
  } catch (err) {
    return handleError(err);
  }
}
