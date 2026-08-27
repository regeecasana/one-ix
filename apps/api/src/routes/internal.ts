import { Router } from "express";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { asyncHandler } from "../middleware/asyncHandler";
import { internalAuth } from "../middleware/internalAuth";
import { serializeCart, serializeCoupon, serializeOrder, serializeProduct } from "../serializers";
import { issueCouponForCart } from "../services/couponService";
import { runAbandonedCartSweep } from "../jobs/abandonedCartSweep";

const router = Router();

// Everything below requires X-Internal-Token -- called only by the Zendesk
// sidebar app (and, for force-sweep, the demo operator). See docs/api-spec.md.
router.use(internalAuth);

router.get(
  "/carts/:cartId/summary",
  asyncHandler(async (req, res) => {
    const cart = await prisma.cart.findUnique({
      where: { id: req.params.cartId },
      include: { items: true, customer: true },
    });
    if (!cart) throw new HttpError(404, "cart_not_found");

    const productIds = [...new Set(cart.items.map((item) => item.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = Object.fromEntries(products.map((p) => [p.id, serializeProduct(p)]));

    const activeCouponRow = await prisma.coupon.findFirst({
      where: { cartId: cart.id, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    // Checked live against expiresAt, not just the status column -- see
    // docs/api-spec.md on why background jobs alone aren't the source of truth.
    const activeCoupon =
      activeCouponRow && activeCouponRow.expiresAt.getTime() > Date.now()
        ? serializeCoupon(activeCouponRow)
        : null;

    const order = await prisma.order.findUnique({ where: { cartId: cart.id } });

    res.json({
      cart: serializeCart(cart),
      customerEmail: cart.customer?.email ?? null,
      products: productMap,
      activeCoupon,
      order: order ? serializeOrder(order) : null,
    });
  })
);

router.post(
  "/carts/:cartId/coupons",
  asyncHandler(async (req, res) => {
    const coupon = await issueCouponForCart({
      cartId: req.params.cartId,
      percentOff: req.body?.percentOff ? Number(req.body.percentOff) : undefined,
      ttlMinutes: req.body?.ttlMinutes ? Number(req.body.ttlMinutes) : undefined,
      zendeskTicketId: req.body?.ticketId ? String(req.body.ticketId) : null,
    });
    res.status(201).json(serializeCoupon(coupon));
  })
);

router.get(
  "/tickets/:ticketId/cart",
  asyncHandler(async (req, res) => {
    const event = await prisma.abandonedCartEvent.findFirst({
      where: { zendeskTicketId: req.params.ticketId },
      orderBy: { detectedAt: "desc" },
    });
    if (!event) throw new HttpError(404, "cart_not_found_for_ticket");
    res.json({ cartId: event.cartId });
  })
);

router.post(
  "/demo/force-sweep",
  asyncHandler(async (_req, res) => {
    const result = await runAbandonedCartSweep();
    res.json(result);
  })
);

export default router;
