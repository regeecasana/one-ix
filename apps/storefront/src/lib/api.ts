import type { Cart, Coupon, Order, Product } from "@oneix/shared";

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

export function createCart(): Promise<Cart> {
  return request<Cart>("/api/carts", { method: "POST" });
}

export function getCart(id: string): Promise<Cart> {
  return request<Cart>(`/api/carts/${id}`);
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

export function checkoutStart(cartId: string, email: string, name?: string): Promise<Cart> {
  return request<Cart>(`/api/carts/${cartId}/checkout/start`, {
    method: "POST",
    body: JSON.stringify(name ? { email, name } : { email }),
  });
}

export function checkoutComplete(cartId: string, couponCode?: string): Promise<Order> {
  return request<Order>(`/api/carts/${cartId}/checkout/complete`, {
    method: "POST",
    body: JSON.stringify(couponCode ? { couponCode } : {}),
  });
}

export interface CouponValidation {
  valid: boolean;
  reason?: string;
  coupon?: Coupon;
}

export function validateCoupon(code: string, cartId: string): Promise<CouponValidation> {
  return request<CouponValidation>(
    `/api/coupons/${encodeURIComponent(code)}?cartId=${encodeURIComponent(cartId)}`
  );
}
