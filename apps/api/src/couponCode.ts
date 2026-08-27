import crypto from "node:crypto";

export function generateCouponCode(percentOff: number): string {
  // 6 bytes = 48 bits of entropy, unsliced -- 4 bytes sliced to 6 hex chars
  // (24 bits, ~16.7M combinations) was brute-forceable against the public
  // GET /api/coupons/:code validation endpoint. 48 bits keeps the code a
  // reasonable length while putting brute force well out of reach; that
  // endpoint is also now rate-limited and requires cartId (see routes/coupons.ts).
  const suffix = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `SAVE${percentOff}-${suffix}`;
}
