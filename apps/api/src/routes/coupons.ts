import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { asyncHandler } from "../middleware/asyncHandler";
import { serializeCoupon } from "../serializers";

const router = Router();

// Coupon codes are unique but not high-entropy secrets on their own -- this
// endpoint is a possible enumeration oracle for guessing active codes, so
// it's rate-limited and requires cartId (a coupon is meaningless without
// knowing which cart it's scoped to anyway, per the storefront UX in
// docs/api-spec.md).
const validateCouponLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/coupons/:code?cartId=... -- inline "apply coupon" validation at
// checkout. Always 200 on a resolved lookup; the body's `valid` flag
// carries the result so the storefront doesn't have to special-case 404s.
router.get(
  "/:code",
  validateCouponLimiter,
  asyncHandler(async (req, res) => {
    const cartId = typeof req.query.cartId === "string" ? req.query.cartId : "";
    if (!cartId) throw new HttpError(400, "cart_id_required");

    const coupon = await prisma.coupon.findUnique({ where: { code: req.params.code } });

    if (!coupon || coupon.cartId !== cartId) {
      res.json({ valid: false, reason: "not_found" });
      return;
    }
    if (coupon.status !== "active" || coupon.expiresAt.getTime() <= Date.now()) {
      res.json({ valid: false, reason: coupon.status === "redeemed" ? "redeemed" : "expired" });
      return;
    }

    res.json({ valid: true, coupon: serializeCoupon(coupon) });
  })
);

export default router;
