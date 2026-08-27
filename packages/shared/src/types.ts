// Shapes shared between apps/storefront, apps/api, and apps/zendesk-app.
// Source of truth is docs/data-model.md and docs/api-spec.md — keep in sync.

export type CartStatus = "active" | "abandoned" | "converted";

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
  remindedAt: string | null;
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
  totalCents: number;
  pointsEarned: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string | null;
  mobileNumber: string | null;
  pointsBalance: number;
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
  supportTickets: SupportTicket[];
}
