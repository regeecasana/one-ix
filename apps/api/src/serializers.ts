import type {
  Cart as PrismaCart,
  CartItem as PrismaCartItem,
  Coupon as PrismaCoupon,
  Order as PrismaOrder,
  Product as PrismaProduct,
} from "@prisma/client";
import type { Cart, CartItem, Coupon, Order, Product } from "@oneix/shared";

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
    lastActivityAt: c.lastActivityAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function serializeCoupon(c: PrismaCoupon): Coupon {
  return {
    id: c.id,
    code: c.code,
    cartId: c.cartId,
    percentOff: c.percentOff,
    status: c.status as Coupon["status"],
    expiresAt: c.expiresAt.toISOString(),
    issuedBy: c.issuedBy as Coupon["issuedBy"],
    zendeskTicketId: c.zendeskTicketId,
    createdAt: c.createdAt.toISOString(),
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
    couponId: o.couponId,
    createdAt: o.createdAt.toISOString(),
  };
}
