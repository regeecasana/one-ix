import type { BuilderRecommendation, Cart, Order, Product, SupportTicket } from "@oneix/shared";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
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

export function recommendPlan(usage: string, devices: string): Promise<BuilderRecommendation> {
  return request<BuilderRecommendation>("/api/builder/recommend", {
    method: "POST",
    body: JSON.stringify({ usage, devices }),
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

export function requestOtp(cartId: string, mobileNumber: string): Promise<{ sent: boolean }> {
  return request(`/api/carts/${cartId}/otp/request`, {
    method: "POST",
    body: JSON.stringify({ mobileNumber }),
  });
}

export function verifyOtp(
  cartId: string,
  params: { email: string; mobileNumber: string; otp: string; name?: string }
): Promise<Cart> {
  return request<Cart>(`/api/carts/${cartId}/otp/verify`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function completeActivation(cartId: string): Promise<Order> {
  return request<Order>(`/api/carts/${cartId}/checkout/complete`, { method: "POST" });
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
