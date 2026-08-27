import type {
  Cart as PrismaCart,
  CartItem as PrismaCartItem,
  Customer as PrismaCustomer,
  Order as PrismaOrder,
  Product as PrismaProduct,
  SupportTicket as PrismaSupportTicket,
} from "@prisma/client";
import type { Cart, CartItem, Customer, Order, Product, SupportTicket } from "@oneix/shared";

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
    remindedAt: c.remindedAt ? c.remindedAt.toISOString() : null,
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
    totalCents: o.totalCents,
    pointsEarned: o.pointsEarned,
    createdAt: o.createdAt.toISOString(),
  };
}

export function serializeCustomer(c: PrismaCustomer): Customer {
  return {
    id: c.id,
    email: c.email,
    name: c.name,
    mobileNumber: c.mobileNumber,
    pointsBalance: c.pointsBalance,
    createdAt: c.createdAt.toISOString(),
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
