import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "../middleware/asyncHandler";
import { serializeCoupon } from "../serializers";

const router = Router();

// GET /api/coupons/:code?cartId=... -- inline "apply coupon" validation at
// checkout. Always 200; the body's `valid` flag carries the result so the
// storefront doesn't have to special-case 404s.
router.get(
  "/:code",
  asyncHandler(async (req, res) => {
    const cartId = typeof req.query.cartId === "string" ? req.query.cartId : undefined;
    const coupon = await prisma.coupon.findUnique({ where: { code: req.params.code } });

    if (!coupon) {
      res.json({ valid: false, reason: "not_found" });
      return;
    }
    if (cartId && coupon.cartId !== cartId) {
      res.json({ valid: false, reason: "cart_mismatch" });
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
