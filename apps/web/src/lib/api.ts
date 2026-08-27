import type { BuilderRecommendation, Cart, InteractionEvent, Order, Product, SupportTicket, Voucher } from "@oneix/shared";

// Same-origin now that api + storefront are one Next.js app -- no base URL,
// no CORS.
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? "request_failed");
  }
  return body as T;
}

export function listProducts(): Promise<Product[]> {
  return request<Product[]>("/api/products");
}

export function getProduct(id: string): Promise<Product> {
  return request<Product>(`/api/products/${id}`);
}

export function recommendPlan(usage: string[], devices: string, priority: string): Promise<BuilderRecommendation> {
  return request<BuilderRecommendation>("/api/builder/recommend", {
    method: "POST",
    body: JSON.stringify({ usage, devices, priority }),
  });
}

export interface Attribution {
  utmSource?: string;
  utmCampaign?: string;
  utmContent?: string;
}

export function createCart(attribution?: Attribution): Promise<Cart> {
  return request<Cart>("/api/carts", { method: "POST", body: JSON.stringify(attribution ?? {}) });
}

export function getCart(id: string): Promise<Cart> {
  return request<Cart>(`/api/carts/${id}`);
}

export function updateCart(id: string, params: { recommendationReason?: string }): Promise<Cart> {
  return request<Cart>(`/api/carts/${id}`, { method: "PATCH", body: JSON.stringify(params) });
}

export function addCartItem(cartId: string, productId: string, quantity: number): Promise<Cart> {
  return request<Cart>(`/api/carts/${cartId}/items`, {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

export function removeCartItem(cartId: string, itemId: string): Promise<Cart> {
  return request<Cart>(`/api/carts/${cartId}/items/${itemId}`, { method: "DELETE" });
}

export function completeActivation(cartId: string, voucherCode?: string): Promise<Order> {
  return request<Order>(`/api/carts/${cartId}/checkout/complete`, {
    method: "POST",
    body: JSON.stringify(voucherCode ? { voucherCode } : {}),
  });
}

export interface BufferedEvent {
  type: string;
  detail: string;
}

export function identifyCustomer(params: {
  email: string;
  name?: string;
  cartId?: string;
  bufferedEvents?: BufferedEvent[];
}): Promise<{ customerId: string; sessionToken: string }> {
  return request("/api/identify", { method: "POST", body: JSON.stringify(params) });
}

export function logInteraction(
  customerId: string,
  sessionToken: string,
  type: string,
  detail: string
): Promise<InteractionEvent> {
  return request<InteractionEvent>(`/api/customers/${customerId}/interactions`, {
    method: "POST",
    body: JSON.stringify({ type, detail, sessionToken }),
  });
}

export function validateVoucher(
  code: string,
  customerId: string,
  productId: string
): Promise<{ valid: boolean; reason?: string; voucher?: Voucher }> {
  const params = new URLSearchParams({ customerId, productId });
  return request(`/api/vouchers/${encodeURIComponent(code)}?${params}`);
}

export function submitSupportTicket(params: {
  email: string;
  subject: string;
  message: string;
}): Promise<SupportTicket> {
  return request<SupportTicket>("/api/support/tickets", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
