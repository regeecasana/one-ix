import crypto from "node:crypto";

// 6 bytes unsliced = 48 bits of entropy. A previous version of this
// generator (for the old Coupon model) sliced 4 bytes down to 6 hex
// chars -- 24 bits, brute-forceable against the validation endpoint in
// hours. Not repeating that here; see git history for the postmortem.
export function generateVoucherCode(percentOff: number): string {
  const suffix = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `SAVE${percentOff}-${suffix}`;
}
