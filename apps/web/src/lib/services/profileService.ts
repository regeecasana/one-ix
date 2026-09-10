import { getContactById, listEventsForContact } from "../bird/client";
import { findLatest, getProductBySlug, searchObjects } from "../bird/objects";
import type { BirdCart, BirdCartItem, BirdOrder, BirdProduct, BirdVoucher } from "../bird/types";
import { HttpError } from "../errors";
import { serializeCart, serializeCustomer, serializeInteractionEvent, serializeOrder, serializeProduct, serializeVoucher } from "../serializers";
import type { CustomerProfile } from "@oneix/shared";

const RECENT_EVENTS_LIMIT = 20;

// What the sidebar app renders, and what gets folded into a standalone
// support ticket's body (see services/supportService.ts) so an agent
// never has to ask who someone is. customerId is a Bird contact id --
// every other lookup here is a Bird Custom Object search/get keyed on it
// (see docs/architecture.md).
export async function buildCustomerProfile(customerId: string): Promise<CustomerProfile> {
  const customer = await getContactById(customerId);
  if (!customer) throw new HttpError(404, "customer_not_found");

  const latestCartRow = await findLatest<BirdCart>("carts", [
    { attribute: "customerId", operator: "string/equals", value: customerId },
  ]);

  let latestCart: CustomerProfile["latestCart"] = null;
  if (latestCartRow) {
    const cartItems = await searchObjects<BirdCartItem>("cartItems", [
      { attribute: "cartId", operator: "string/equals", value: latestCartRow.id },
    ]);
    const productIds = [...new Set(cartItems.map((i) => i.productId))];
    const products = await Promise.all(productIds.map((slug) => getProductBySlug(slug)));
    latestCart = {
      ...serializeCart(latestCartRow, cartItems),
      products: Object.fromEntries(
        products.filter((p): p is BirdProduct => p !== null).map((p) => [p.slug, serializeProduct(p)])
      ),
    };
  }

  const latestOrderRow = await findLatest<BirdOrder>("orders", [
    { attribute: "customerId", operator: "string/equals", value: customerId },
  ]);

  const latestVoucherRow = await findLatest<BirdVoucher>("vouchers", [
    { attribute: "customerId", operator: "string/equals", value: customerId },
  ]);
  // Checked live against expiresAt, not just the status column -- same
  // reasoning as every earlier version of this endpoint.
  const activeVoucher =
    latestVoucherRow && latestVoucherRow.status === "active" && new Date(latestVoucherRow.expiresAt).getTime() > Date.now()
      ? serializeVoucher(latestVoucherRow)
      : null;

  const recentEventRows = await listEventsForContact(customerId, RECENT_EVENTS_LIMIT);

  return {
    customer: serializeCustomer(customer),
    latestCart,
    latestOrder: latestOrderRow ? serializeOrder(latestOrderRow) : null,
    activeVoucher,
    latestVoucher: latestVoucherRow ? serializeVoucher(latestVoucherRow) : null,
    recentEvents: recentEventRows.map(serializeInteractionEvent),
  };
}

export function profileToTicketContext(profile: CustomerProfile): string {
  const lines = [`Customer: ${profile.customer.email}${profile.customer.name ? ` (${profile.customer.name})` : ""}`];

  if (profile.latestCart) {
    const source = profile.latestCart.utmCampaign
      ? `${profile.latestCart.utmCampaign} (${profile.latestCart.utmSource ?? "unknown source"})`
      : "direct";
    lines.push(``, `Latest setup (${profile.latestCart.status}), campaign: ${source}`);
    if (profile.latestCart.recommendationReason) {
      lines.push(`Recommended because: ${profile.latestCart.recommendationReason}`);
    }
    for (const item of profile.latestCart.items) {
      const product = profile.latestCart.products[item.productId];
      lines.push(`  ${item.quantity} x ${product?.name ?? item.productId}`);
    }
  }

  if (profile.latestOrder) {
    lines.push(
      ``,
      `Latest activation: order ${profile.latestOrder.id}, Rp ${profile.latestOrder.totalCents.toLocaleString("id-ID")}`
    );
  }

  return lines.join("\n");
}
