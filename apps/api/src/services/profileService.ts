import { prisma } from "../db";
import { HttpError } from "../errors";
import { serializeCart, serializeCustomer, serializeInteractionEvent, serializeOrder, serializeProduct, serializeVoucher } from "../serializers";
import type { CustomerProfile } from "@oneix/shared";

const RECENT_EVENTS_LIMIT = 20;

// What the sidebar app renders, and what gets folded into a standalone
// support ticket's body (see services/supportService.ts) so an agent
// never has to ask who someone is.
export async function buildCustomerProfile(customerId: string): Promise<CustomerProfile> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new HttpError(404, "customer_not_found");

  const latestCartRow = await prisma.cart.findFirst({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  let latestCart: CustomerProfile["latestCart"] = null;
  if (latestCartRow) {
    const productIds = [...new Set(latestCartRow.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    latestCart = {
      ...serializeCart(latestCartRow),
      products: Object.fromEntries(products.map((p) => [p.id, serializeProduct(p)])),
    };
  }

  const latestOrderRow = await prisma.order.findFirst({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });

  const activeVoucherRow = await prisma.voucher.findFirst({
    where: { customerId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  // Checked live against expiresAt, not just the status column -- same
  // reasoning as every earlier version of this endpoint.
  const activeVoucher =
    activeVoucherRow && activeVoucherRow.expiresAt.getTime() > Date.now() ? serializeVoucher(activeVoucherRow) : null;

  const recentEventRows = await prisma.interactionEvent.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: RECENT_EVENTS_LIMIT,
  });

  return {
    customer: serializeCustomer(customer),
    latestCart,
    latestOrder: latestOrderRow ? serializeOrder(latestOrderRow) : null,
    activeVoucher,
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
      `Latest activation: order ${profile.latestOrder.id}, $${(profile.latestOrder.totalCents / 100).toFixed(2)}`
    );
  }

  return lines.join("\n");
}
