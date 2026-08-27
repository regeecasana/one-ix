import { createHmac, timingSafeEqual } from "crypto";
import { env } from "./env";

// Binds a customerId to the browser that identified as it, issued once by
// POST /api/identify and echoed back on every interaction-logging call.
// This does NOT verify email ownership (that's an explicit, already-
// surfaced tradeoff of the no-OTP identify flow) -- it only stops a third
// party who merely observes or guesses a customerId from spamming
// interactions onto a ticket they never identified into.
export function signSession(customerId: string): string {
  return createHmac("sha256", env.sessionSecret).update(customerId).digest("hex");
}

export function verifySession(customerId: string, token: unknown): boolean {
  if (typeof token !== "string" || !token) return false;
  const expected = Buffer.from(signSession(customerId), "hex");
  const actual = Buffer.from(token, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
