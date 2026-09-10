// Record shapes for each Bird Custom Object this app uses. Field names
// match packages/shared's wire types 1:1 so serializers.ts stays a
// near-identity mapping. Dates are ISO strings (JSON has no native date
// type -- unlike the Prisma types these replace, which used `Date`).

// Bird auto-assigns `id` on every Custom Object record and rejects a
// client-supplied one ("unexpected object field \"id\"", confirmed
// empirically) -- but the rest of this app hardcodes stable, readable
// product ids (e.g. "plan-gosurf799") in recommendation logic and the
// storefront UI. `slug` carries that stable id as a real attribute;
// `id` here is Bird's own opaque record id, used only for update/delete
// calls. `serializeProduct` maps `slug` onto the wire `Product.id` field
// so nothing above this layer needs to know the difference (same pattern
// as Voucher.code or activity_tickets.ticketId).
export interface BirdProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
}

// Bird's Custom Object attribute types have no array/JSON option (checked
// against a live workspace's field-type picker: Text, Number, Toggle,
// Select, Date, Date and Time, URL, Email Address, Phone Number, Domain,
// Tags -- no structured/array type). So unlike the original migration
// design, CartItem/OrderItem are NOT embedded on their parent -- they're
// their own Custom Objects (`cart_items`, `order_items`), same as the
// original Prisma model, fetched separately via searchObjects.
export interface BirdCartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface BirdOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface BirdCart {
  id: string;
  customerId: string | null;
  status: string;
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
