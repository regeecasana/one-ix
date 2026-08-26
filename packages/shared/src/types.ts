// Shapes shared between apps/storefront, apps/api, and apps/zendesk-app.
// Source of truth is docs/data-model.md and docs/api-spec.md — keep in sync.

export type CartStatus = "active" | "abandoned" | "converted";

export type CouponStatus = "active" | "redeemed" | "expired";

export type CouponIssuedBy = "agent" | "system";

export type AbandonedCartEventStatus =
  | "detected"
  | "ticket_created"
  | "coupon_sent"
  | "recovered"
  | "expired_unused";

export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Cart {
  id: string;
  customerId: string | null;
  status: CartStatus;
  items: CartItem[];
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  cartId: string;
  percentOff: number;
  status: CouponStatus;
  expiresAt: string;
  issuedBy: CouponIssuedBy;
  zendeskTicketId: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  cartId: string;
  customerId: string;
  status: "paid";
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  couponId: string | null;
  createdAt: string;
}

/** What GET /api/internal/carts/:cartId/summary returns to the Zendesk sidebar app. */
export interface CartSummary {
  cart: Cart;
  customerEmail: string | null;
  products: Record<string, Product>;
  activeCoupon: Coupon | null;
  order: Order | null;
}
