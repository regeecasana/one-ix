// Record shapes for each Bird Custom Object this app uses. Field names
// match packages/shared's wire types 1:1 so serializers.ts stays a
// near-identity mapping. Dates are ISO strings (JSON has no native date
// type -- unlike the Prisma types these replace, which used `Date`).

export interface BirdProduct {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
}

export interface BirdCartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface BirdCart {
  id: string;
  customerId: string | null;
  status: string;
  items: BirdCartItem[];
  utmSource: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  recommendationReason: string | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BirdOrder {
  id: string;
  cartId: string;
  customerId: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  voucherId: string | null;
  createdAt: string;
  items: BirdCartItem[];
}

export interface BirdVoucher {
  id: string;
  code: string;
  customerId: string;
  productId: string;
  percentOff: number;
  status: string;
  expiresAt: string;
  issuedBy: string;
  resendCount: number;
  zendeskTicketId: string | null;
  createdAt: string;
}

// Bridges Zendesk ticket id -> Bird contact id. Needed because the
// Contacts API only supports lookup by a declared identifier (email,
// externalId) -- there's no confirmed way to search contacts by an
// arbitrary attribute like activeTicketId, unlike Custom Objects which do
// support attribute search. See docs/architecture.md.
export interface BirdActivityTicket {
  id: string;
  ticketId: string;
  customerId: string;
  createdAt: string;
}

export interface BirdSupportTicket {
  id: string;
  customerId: string;
  zendeskTicketId: string | null;
  subject: string;
  message: string;
  createdAt: string;
}
