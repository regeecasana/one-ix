import type {
  Cart as PrismaCart,
  CartItem as PrismaCartItem,
  Customer as PrismaCustomer,
  InteractionEvent as PrismaInteractionEvent,
  Order as PrismaOrder,
  Product as PrismaProduct,
  SupportTicket as PrismaSupportTicket,
  Voucher as PrismaVoucher,
} from "@prisma/client";
import type {
  Cart,
  CartItem,
  Customer,
  InteractionEvent,
  Order,
  Product,
  SupportTicket,
  Voucher,
} from "@oneix/shared";

export function serializeProduct(p: PrismaProduct): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    stock: p.stock,
  };
}

export function serializeCartItem(i: PrismaCartItem): CartItem {
  return {
    id: i.id,
    cartId: i.cartId,
    productId: i.productId,
    quantity: i.quantity,
    unitPriceCents: i.unitPriceCents,
  };
}

export function serializeCart(c: PrismaCart & { items: PrismaCartItem[] }): Cart {
  return {
    id: c.id,
    customerId: c.customerId,
    status: c.status as Cart["status"],
    items: c.items.map(serializeCartItem),
    utmSource: c.utmSource,
    utmCampaign: c.utmCampaign,
    utmContent: c.utmContent,
    recommendationReason: c.recommendationReason,
    lastActivityAt: c.lastActivityAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function serializeOrder(o: PrismaOrder): Order {
  return {
    id: o.id,
    cartId: o.cartId,
    customerId: o.customerId,
    status: "paid",
    subtotalCents: o.subtotalCents,
    discountCents: o.discountCents,
    totalCents: o.totalCents,
    voucherId: o.voucherId,
    createdAt: o.createdAt.toISOString(),
  };
}

export function serializeCustomer(c: PrismaCustomer): Customer {
  return {
    id: c.id,
    email: c.email,
    name: c.name,
    activeTicketId: c.activeTicketId,
    createdAt: c.createdAt.toISOString(),
  };
}

export function serializeVoucher(v: PrismaVoucher): Voucher {
  return {
    id: v.id,
    code: v.code,
    customerId: v.customerId,
    productId: v.productId,
    percentOff: v.percentOff,
    status: v.status as Voucher["status"],
    expiresAt: v.expiresAt.toISOString(),
    issuedBy: "agent",
    resendCount: v.resendCount,
    zendeskTicketId: v.zendeskTicketId,
    createdAt: v.createdAt.toISOString(),
  };
}

export function serializeInteractionEvent(e: PrismaInteractionEvent): InteractionEvent {
  return {
    id: e.id,
    customerId: e.customerId,
    type: e.type,
    detail: e.detail,
    createdAt: e.createdAt.toISOString(),
  };
}

export function serializeSupportTicket(t: PrismaSupportTicket): SupportTicket {
  return {
    id: t.id,
    customerId: t.customerId,
    zendeskTicketId: t.zendeskTicketId,
    subject: t.subject,
    message: t.message,
    createdAt: t.createdAt.toISOString(),
  };
}
