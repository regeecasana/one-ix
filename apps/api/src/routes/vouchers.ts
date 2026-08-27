import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { asyncHandler } from "../middleware/asyncHandler";
import { serializeVoucher } from "../serializers";

const router = Router();

// A voucher code alone is only ~48 bits of entropy -- require both ids and
// rate-limit so this can't be used as a bare enumeration oracle (same
// reasoning as the earlier coupon-validation endpoint it replaces).
const validateVoucherLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get(
  "/:code",
  validateVoucherLimiter,
  asyncHandler(async (req, res) => {
    const customerId = typeof req.query.customerId === "string" ? req.query.customerId : "";
    const productId = typeof req.query.productId === "string" ? req.query.productId : "";
    if (!customerId || !productId) throw new HttpError(400, "customer_and_product_required");

    const voucher = await prisma.voucher.findUnique({ where: { code: req.params.code } });

    if (!voucher || voucher.customerId !== customerId || voucher.productId !== productId) {
      res.json({ valid: false, reason: "not_found" });
      return;
    }
    if (voucher.status !== "active" || voucher.expiresAt.getTime() <= Date.now()) {
      res.json({ valid: false, reason: voucher.status === "redeemed" ? "redeemed" : "expired" });
      return;
    }

    res.json({ valid: true, voucher: serializeVoucher(voucher) });
  })
);

export default router;
