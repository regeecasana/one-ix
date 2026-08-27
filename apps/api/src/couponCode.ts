import crypto from "node:crypto";

export function generateCouponCode(percentOff: number): string {
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `SAVE${percentOff}-${suffix}`;
}
