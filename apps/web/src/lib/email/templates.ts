import { env } from "../env";

// priceCents actually stores whole Rupiah (no fractional currency in this
// catalog) -- see src/lib/money.ts for the matching client-side formatter.
function formatCents(cents: number): string {
  return `Rp ${cents.toLocaleString("id-ID")}`;
}

export function voucherEmail(params: {
  productName: string;
  code: string;
  percentOff: number;
  expiresAt: Date;
  cartId?: string;
}): { subject: string; text: string } {
  const minutesLeft = Math.max(1, Math.round((params.expiresAt.getTime() - Date.now()) / 60_000));
  const link = params.cartId
    ? `${env.siteUrl}/setup/${params.cartId}?voucher=${params.code}`
    : `${env.siteUrl}/setup`;

  const subject = `Here's ${params.percentOff}% off ${params.productName}`;
  const text = [
    `You were checking out ${params.productName} -- here's ${params.percentOff}% off if you want to finish setting it up.`,
    ``,
    `Voucher code: ${params.code}`,
    `This expires in ${minutesLeft} minutes (at ${params.expiresAt.toISOString()}).`,
    ``,
    `Use it here: ${link}`,
  ].join("\n");

  return { subject, text };
}

export function activationConfirmationEmail(params: {
  orderId: string;
  items: { name: string; quantity: number; unitPriceCents: number }[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}): { subject: string; text: string } {
  const subject = `Your setup is active -- ${params.orderId}`;

  const lines = params.items.map(
    (item) => `  ${item.quantity} x ${item.name} — ${formatCents(item.unitPriceCents * item.quantity)}`
  );

  const text = [
    `Your setup is now active!`,
    ``,
    ...lines,
    ``,
    `Subtotal: ${formatCents(params.subtotalCents)}`,
    ...(params.discountCents > 0 ? [`Discount: -${formatCents(params.discountCents)}`] : []),
    `Total: ${formatCents(params.totalCents)}`,
    ``,
    `No real payment was processed -- this is a demo.`,
  ].join("\n");

  return { subject, text };
}
