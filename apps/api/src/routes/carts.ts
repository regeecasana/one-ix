import { Router } from "express";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { asyncHandler } from "../middleware/asyncHandler";
import { serializeCart, serializeOrder } from "../serializers";
import { completeCheckout } from "../services/orderService";

const router = Router();

// A cart mutation on an `abandoned` cart means the customer is re-engaging
// (e.g. they followed the coupon email back) -- flip it back to `active`.
// `converted` never reopens.
function reactivatedStatus(status: string): string {
  return status === "abandoned" ? "active" : status;
}

router.post(
  "/",
  asyncHandler(async (_req, res) => {
    const cart = await prisma.cart.create({ data: {}, include: { items: true } });
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
  "/:id/checkout/start",
  asyncHandler(async (req, res) => {
    const cart = await prisma.cart.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!cart) throw new HttpError(404, "cart_not_found");
    if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");
    if (cart.items.length === 0) throw new HttpError(400, "cart_is_empty");

    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    if (!email) throw new HttpError(400, "email_required");
    const name = req.body?.name ? String(req.body.name) : undefined;

    const customer = await prisma.customer.upsert({
      where: { email },
      update: name ? { name } : {},
      create: { email, name },
    });

    const updated = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        customerId: customer.id,
        lastActivityAt: new Date(),
        status: reactivatedStatus(cart.status),
      },
      include: { items: true },
    });

    res.json(serializeCart(updated));
  })
);

router.post(
  "/:id/checkout/complete",
  asyncHandler(async (req, res) => {
    const couponCode = req.body?.couponCode ? String(req.body.couponCode) : undefined;
    const order = await completeCheckout(req.params.id, couponCode);
    res.status(201).json(serializeOrder(order));
  })
);

export default router;
