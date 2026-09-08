import type { BirdCart, BirdCartItem, BirdOrder, BirdProduct, BirdSupportTicket, BirdVoucher } from "./bird/types";
import type { BirdContact } from "./bird/client";
import type { BirdEvent } from "./bird/client";
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

export function serializeProduct(p: BirdProduct): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    stock: p.stock,
  };
}

export function serializeCartItem(i: BirdCartItem, cartId: string): CartItem {
  return {
    id: i.id,
    cartId,
    productId: i.productId,
    quantity: i.quantity,
    unitPriceCents: i.unitPriceCents,
  };
}

export function serializeCart(c: BirdCart): Cart {
  return {
    id: c.id,
    customerId: c.customerId,
    status: c.status as Cart["status"],
    items: c.items.map((i) => serializeCartItem(i, c.id)),
    utmSource: c.utmSource,
    utmCampaign: c.utmCampaign,
    utmContent: c.utmContent,
    recommendationReason: c.recommendationReason,
    lastActivityAt: c.lastActivityAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export function serializeOrder(o: BirdOrder): Order {
  return {
    id: o.id,
    cartId: o.cartId,
    customerId: o.customerId,
    status: "paid",
    subtotalCents: o.subtotalCents,
    discountCents: o.discountCents,
    totalCents: o.totalCents,
    voucherId: o.voucherId,
    createdAt: o.createdAt,
  };
}

export function serializeCustomer(c: BirdContact): Customer {
  return {
    id: c.id,
    email: c.email,
    name: c.name,
    activeTicketId: c.activeTicketId,
    createdAt: c.createdAt,
  };
}

export function serializeVoucher(v: BirdVoucher): Voucher {
  return {
    id: v.id,
    code: v.code,
    customerId: v.customerId,
    productId: v.productId,
    percentOff: v.percentOff,
    status: v.status as Voucher["status"],
    expiresAt: v.expiresAt,
    issuedBy: "agent",
    resendCount: v.resendCount,
    zendeskTicketId: v.zendeskTicketId,
    createdAt: v.createdAt,
  };
}

export function serializeInteractionEvent(e: BirdEvent): InteractionEvent {
  return {
    id: e.id,
    customerId: e.contactId,
    type: e.eventName,
    detail: (e.properties?.detail as string) ?? "",
    createdAt: e.createdAt,
  };
}

export function serializeSupportTicket(t: BirdSupportTicket): SupportTicket {
  return {
    id: t.id,
    customerId: t.customerId,
    zendeskTicketId: t.zendeskTicketId,
    subject: t.subject,
    message: t.message,
    createdAt: t.createdAt,
  };
}
