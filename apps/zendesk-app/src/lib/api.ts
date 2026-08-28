import type { CustomerProfile, Product, Voucher } from "@oneix/shared";
import type { ZafContext } from "./zaf";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(ctx: ZafContext, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ctx.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Token": ctx.internalToken,
      ...init?.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? "request_failed");
  }
  return body as T;
}

export function getCustomerIdForTicket(ctx: ZafContext, ticketId: string): Promise<{ customerId: string }> {
  return request(ctx, `/api/internal/tickets/${ticketId}/customer`);
}

export function getCustomerProfile(ctx: ZafContext, customerId: string): Promise<CustomerProfile> {
  return request(ctx, `/api/internal/customers/${customerId}/profile`);
}

export function getCustomerProfileByEmail(ctx: ZafContext, email: string): Promise<CustomerProfile> {
  const params = new URLSearchParams({ email });
  return request(ctx, `/api/internal/customers/by-email?${params}`);
}

export function getInsight(ctx: ZafContext, customerId: string): Promise<{ insight: string }> {
  return request(ctx, `/api/internal/customers/${customerId}/insights`, { method: "POST" });
}

export function issueVoucher(
  ctx: ZafContext,
  customerId: string,
  params: { productId: string; percentOff?: number; ttlMinutes?: number }
): Promise<Voucher> {
  return request(ctx, `/api/internal/customers/${customerId}/vouchers`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function resendVoucher(ctx: ZafContext, voucherId: string, ttlMinutes?: number): Promise<Voucher> {
  return request(ctx, `/api/internal/vouchers/${voucherId}/resend`, {
    method: "POST",
    body: JSON.stringify(ttlMinutes ? { ttlMinutes } : {}),
  });
}

export function closeTicket(ctx: ZafContext, ticketId: string): Promise<{ closed: boolean }> {
  return request(ctx, `/api/internal/tickets/${ticketId}/close`, { method: "POST" });
}

// Public, unauthenticated -- used only to populate the "issue a voucher
// for..." product picker when the customer has no cart yet to default to.
export function listProducts(ctx: ZafContext): Promise<Product[]> {
  return request(ctx, "/api/products");
}
