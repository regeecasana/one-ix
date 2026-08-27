import crypto from "node:crypto";
import type { Cart as PrismaCart } from "@prisma/client";
import { prisma } from "../db";
import { HttpError } from "../errors";

const OTP_CONSENT_POINTS = 5000;

function generateOtpCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

// Mock SMS: no real carrier gateway involved (see docs/architecture.md). The
// code is logged server-side, same pattern as the Ethereal email preview
// link -- this is a demo of the flow, not a working SMS integration.
export async function requestOtp(cartId: string, mobileNumber: string): Promise<void> {
  const cart = await prisma.cart.findUnique({ where: { id: cartId } });
  if (!cart) throw new HttpError(404, "cart_not_found");
  if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");

  const code = generateOtpCode();
  await prisma.cart.update({
    where: { id: cartId },
    data: { pendingOtpMobile: mobileNumber, pendingOtpCode: code },
  });

  console.log(`[otp] mobile=${mobileNumber} code=${code}`);
}

// "Save my setup": verifies the OTP, then resolves identity -- find an
// existing Customer by mobile number or email (whichever matches first),
// or create one. Anonymous cart signals + the resolved Customer record =
// the Unified Profile from here on.
export async function verifyOtpAndSaveSetup(
  cartId: string,
  params: { email: string; mobileNumber: string; otp: string; name?: string }
): Promise<PrismaCart> {
  const cart = await prisma.cart.findUnique({ where: { id: cartId } });
  if (!cart) throw new HttpError(404, "cart_not_found");
  if (cart.status === "converted") throw new HttpError(409, "cart_already_converted");
  if (
    !cart.pendingOtpCode ||
    cart.pendingOtpMobile !== params.mobileNumber ||
    cart.pendingOtpCode !== params.otp
  ) {
    throw new HttpError(400, "invalid_otp");
  }

  const existing = await prisma.customer.findFirst({
    where: { OR: [{ mobileNumber: params.mobileNumber }, { email: params.email }] },
  });

  // The 5,000-point OTP-consent bonus is a one-time, first-verification
  // reward -- an already-known customer building a second setup later
  // doesn't get to re-earn it just by re-verifying (that'd be a
  // farm-more-setups-for-more-points exploit).
  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data: {
          mobileNumber: params.mobileNumber,
          name: params.name ?? existing.name,
        },
      })
    : await prisma.customer.create({
        data: {
          email: params.email,
          mobileNumber: params.mobileNumber,
          name: params.name,
          pointsBalance: OTP_CONSENT_POINTS,
        },
      });

  return prisma.cart.update({
    where: { id: cart.id },
    data: {
      customerId: customer.id,
      lastActivityAt: new Date(),
      pendingOtpMobile: null,
      pendingOtpCode: null,
    },
  });
}
