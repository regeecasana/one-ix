import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { asyncHandler } from "../middleware/asyncHandler";
import { serializeCart, serializeOrder } from "../serializers";
import { completeCheckout } from "../services/orderService";
import { requestOtp, verifyOtpAndSaveSetup } from "../services/identityService";

const router = Router();

// OTP requests trigger an (mocked) SMS send per mobile number -- cap abuse.
const otpRequestLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// A cart mutation on an `abandoned` cart means the customer is re-engaging
// (e.g. they followed the nudge email back) -- flip it back to `active`.
// `converted` never reopens.
function reactivatedStatus(status: string): string {
  return status === "abandoned" ? "active" : status;
}

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const cart = await prisma.cart.create({
      data: {
        utmSource: req.body?.utmSource ? String(req.body.utmSource) : undefined,
        utmCampaign: req.body?.utmCampaign ? String(req.body.utmCampaign) : undefined,
        utmContent: req.body?.utmContent ? String(req.body.utmContent) : undefined,
      },
      include: { items: true },
    });
    res.status(201).json(serializeCart(cart));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const cart = await prisma.cart.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!cart) throw new HttpError(404, "cart_not_found");
    res.json(serializeCart(cart));
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const cart = await prisma.cart.findUnique({ where: { id: req.params.id } });
    if (!cart) throw new HttpError(404, "cart_not_found");
    if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");

    const updated = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        recommendationReason: req.body?.recommendationReason
          ? String(req.body.recommendationReason)
          : cart.recommendationReason,
        lastActivityAt: new Date(),
      },
      include: { items: true },
    });

    res.json(serializeCart(updated));
  })
);

router.post(
  "/:id/items",
  asyncHandler(async (req, res) => {
    const cart = await prisma.cart.findUnique({ where: { id: req.params.id } });
    if (!cart) throw new HttpError(404, "cart_not_found");
    if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");

    const productId = String(req.body?.productId ?? "");
    const quantity = Number(req.body?.quantity);
    if (!productId) throw new HttpError(400, "product_id_required");
    if (!Number.isInteger(quantity) || quantity < 1) throw new HttpError(400, "invalid_quantity");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new HttpError(404, "product_not_found");

    const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId } });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity, unitPriceCents: product.priceCents },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity, unitPriceCents: product.priceCents },
      });
    }

    const updated = await prisma.cart.update({
      where: { id: cart.id },
      data: { lastActivityAt: new Date(), status: reactivatedStatus(cart.status) },
      include: { items: true },
    });

    res.json(serializeCart(updated));
  })
);

router.delete(
  "/:id/items/:itemId",
  asyncHandler(async (req, res) => {
    const cart = await prisma.cart.findUnique({ where: { id: req.params.id } });
    if (!cart) throw new HttpError(404, "cart_not_found");
    if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");

    const item = await prisma.cartItem.findFirst({ where: { id: req.params.itemId, cartId: cart.id } });
    if (!item) throw new HttpError(404, "item_not_found");

    await prisma.cartItem.delete({ where: { id: item.id } });

    const updated = await prisma.cart.update({
      where: { id: cart.id },
      data: { lastActivityAt: new Date(), status: reactivatedStatus(cart.status) },
      include: { items: true },
    });

    res.json(serializeCart(updated));
  })
);

router.post(
  "/:id/otp/request",
  otpRequestLimiter,
  asyncHandler(async (req, res) => {
    const mobileNumber = String(req.body?.mobileNumber ?? "").trim();
    if (!mobileNumber) throw new HttpError(400, "mobile_number_required");
    await requestOtp(req.params.id, mobileNumber);
    res.json({ sent: true });
  })
);

router.post(
  "/:id/otp/verify",
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const mobileNumber = String(req.body?.mobileNumber ?? "").trim();
    const otp = String(req.body?.otp ?? "").trim();
    const name = req.body?.name ? String(req.body.name) : undefined;

    if (!email) throw new HttpError(400, "email_required");
    if (!mobileNumber) throw new HttpError(400, "mobile_number_required");
    if (!otp) throw new HttpError(400, "otp_required");

    const cart = await prisma.cart.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!cart) throw new HttpError(404, "cart_not_found");
    if (cart.items.length === 0) throw new HttpError(400, "cart_is_empty");

    await verifyOtpAndSaveSetup(req.params.id, { email, mobileNumber, otp, name });

    const updated = await prisma.cart.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { items: true },
    });
    res.json(serializeCart(updated));
  })
);

router.post(
  "/:id/checkout/complete",
  asyncHandler(async (req, res) => {
    const order = await completeCheckout(req.params.id);
    res.status(201).json(serializeOrder(order));
  })
);

export default router;
