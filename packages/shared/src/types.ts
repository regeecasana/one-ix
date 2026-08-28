// Shapes shared between apps/storefront, apps/api, and apps/zendesk-app.
// Source of truth is docs/data-model.md and docs/api-spec.md — keep in sync.

export type CartStatus = "active" | "converted";

export type VoucherStatus = "active" | "redeemed" | "expired";

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
  utmSource: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  recommendationReason: string | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  cartId: string;
  customerId: string;
  status: "paid";
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  voucherId: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string | null;
  activeTicketId: string | null;
  createdAt: string;
}

export interface Voucher {
  id: string;
  code: string;
  customerId: string;
  productId: string;
  percentOff: number;
  status: VoucherStatus;
  expiresAt: string;
  issuedBy: "agent";
  resendCount: number;
  zendeskTicketId: string | null;
  createdAt: string;
}

export interface InteractionEvent {
  id: string;
  customerId: string;
  type: string;
  detail: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  customerId: string;
  zendeskTicketId: string | null;
  subject: string;
  message: string;
  createdAt: string;
}

/** Connectivity Builder recommendation, from POST /api/builder/recommend. */
export interface BuilderRecommendation {
  productId: string;
  reason: string;
}

/** What GET /api/internal/customers/:customerId/profile returns to the Zendesk sidebar app. */
export interface CustomerProfile {
  customer: Customer;
  latestCart: (Cart & { products: Record<string, Product> }) | null;
  latestOrder: Order | null;
  /** Only set if there's a currently-valid (status active, not expired) voucher. */
  activeVoucher: Voucher | null;
  /**
   * The customer's most recent voucher regardless of status -- lets the
   * sidebar app tell "never issued" (null) apart from "expired, unused"
   * (set, but activeVoucher is null) so it can offer "Resend" only in the
   * latter case. See docs/zendesk-app.md.
   */
  latestVoucher: Voucher | null;
  recentEvents: InteractionEvent[];
}
