import { HttpError } from "../errors";
import { computeSubtotalCents } from "./cartService";
import { etherealEmailProvider } from "../email/ethereal";
import { activationConfirmationEmail } from "../email/templates";
import { logInteraction } from "./interactionService";
import { getContactById } from "../bird/client";
import { createObject, findLatest, getObject, getProductBySlug, searchObjects, updateObject } from "../bird/objects";
import type { BirdCart, BirdCartItem, BirdOrder, BirdOrderItem, BirdProduct, BirdVoucher } from "../bird/types";

// Bird's Custom Objects have no confirmed transaction/atomic-increment
// support (see docs/architecture.md), unlike the Prisma $transaction this
// replaced. This is a best-effort saga instead of a real transaction:
// sequential writes with compensation on a failed step, not a guarantee.
// Accepted trade-off for this app's traffic level -- a genuine (small)
// race window exists between the stock check and the stock write, and a
// crash between steps can leave an order in "pending"/"failed" status
// that needs manual cleanup.
export async function completeCheckout(cartId: string, voucherCode?: string): Promise<BirdOrder> {
  const cart = await getObject<BirdCart>("carts", cartId);
  if (!cart) throw new HttpError(404, "cart_not_found");
  if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");
  if (!cart.customerId) throw new HttpError(400, "setup_not_identified");

  const cartItems = await searchObjects<BirdCartItem>("cartItems", [
    { attribute: "cartId", operator: "string/equals", value: cart.id },
  ]);
  if (cartItems.length === 0) throw new HttpError(400, "cart_is_empty");

  const customer = await getContactById(cart.customerId);
  if (!customer) throw new HttpError(400, "setup_not_identified");

  const products = await Promise.all(cartItems.map((item) => getProductBySlug(item.productId)));
  // Keyed by slug (cartItems[].productId), not Bird's own record id --
  // see the note on BirdProduct in ./types.ts.
  const productsBySlug = new Map(products.filter((p): p is BirdProduct => p !== null).map((p) => [p.slug, p]));

  const subtotalCents = computeSubtotalCents(cartItems);

  let voucher: BirdVoucher | null = null;
  if (voucherCode) {
    voucher = await findLatest<BirdVoucher>("vouchers", [
      { attribute: "code", operator: "string/equals", value: voucherCode },
    ]);
    const isValid =
      voucher &&
      voucher.customerId === cart.customerId &&
      voucher.status === "active" &&
      new Date(voucher.expiresAt).getTime() > Date.now() &&
      cartItems.some((item) => item.productId === voucher!.productId);
    if (!isValid) throw new HttpError(400, "invalid_voucher");
  }

  const discountCents = voucher ? Math.round((subtotalCents * voucher.percentOff) / 100) : 0;
  const totalCents = subtotalCents - discountCents;

  const order = await createObject<BirdOrder>("orders", {
    cartId: cart.id,
    customerId: cart.customerId,
    status: "pending",
    subtotalCents,
    discountCents,
    totalCents,
    voucherId: voucher?.id ?? null,
  });
  if (!order) throw new HttpError(502, "order_creation_failed");

  // Best-effort audit trail, decoupled from the live cart (mirrors the
  // original Prisma OrderItem) -- never read back by the app today.
  // createObject already fails soft (logs + returns null), so a failure
  // here doesn't block checkout.
  for (const item of cartItems) {
    await createObject<BirdOrderItem>("orderItems", {
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    });
  }

  const decremented: { slug: string; quantity: number }[] = [];
  try {
    for (const item of cartItems) {
      const product = productsBySlug.get(item.productId);
      if (!product || product.stock < item.quantity) {
        throw new HttpError(409, "insufficient_stock");
      }
      const updated = await updateObject<BirdProduct>("products", product.id, { stock: product.stock - item.quantity });
      if (!updated) throw new HttpError(502, "stock_update_failed");
      decremented.push({ slug: item.productId, quantity: item.quantity });
    }
  } catch (err) {
    // Best-effort compensation -- re-increment whatever we already
    // decremented. Not a guarantee: this can itself fail (see file header).
    for (const d of decremented) {
      const product = productsBySlug.get(d.slug);
      if (product) {
        await updateObject<BirdProduct>("products", product.id, { stock: product.stock });
      }
    }
    await updateObject<BirdOrder>("orders", order.id, { status: "failed" });
    throw err;
  }

  await updateObject<BirdCart>("carts", cart.id, { status: "converted" });

  if (voucher) {
    await updateObject<BirdVoucher>("vouchers", voucher.id, { status: "redeemed" });
  }

  const paidOrder = (await updateObject<BirdOrder>("orders", order.id, { status: "paid" })) ?? order;

  const itemsSummary = cartItems.map((item) => productsBySlug.get(item.productId)?.name ?? item.productId).join(", ");
  const detail = voucher
    ? `Activated ${itemsSummary} with voucher ${voucher.code} applied.`
    : `Activated ${itemsSummary}.`;
  await logInteraction(cart.customerId, "activated", detail);

  const { subject, text } = activationConfirmationEmail({
    orderId: paidOrder.id,
    items: cartItems.map((item) => ({
      name: productsBySlug.get(item.productId)?.name ?? item.productId,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
    subtotalCents,
    discountCents,
    totalCents,
  });

  try {
    await etherealEmailProvider.send({ to: customer.email, subject, text });
  } catch (err) {
    console.error("[email] failed to send activation confirmation", err);
  }

  return paidOrder;
}
