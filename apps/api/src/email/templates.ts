import { env } from "../env";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function couponEmail(params: {
  productName: string;
  code: string;
  percentOff: number;
  expiresAt: Date;
  cartId: string;
}): { subject: string; text: string } {
  const link = `${env.storefrontUrl}/cart/${params.cartId}?coupon=${params.code}`;
  const minutesLeft = Math.max(1, Math.round((params.expiresAt.getTime() - Date.now()) / 60_000));

  const subject = "You left something behind — here's 20% off";
  const text = [
    `You just got a ${params.percentOff}% off coupon that can be used to buy ${params.productName}.`,
    ``,
    `Coupon code: ${params.code}`,
    `This expires in ${minutesLeft} minutes (at ${params.expiresAt.toISOString()}).`,
    ``,
    `Use it here: ${link}`,
  ].join("\n");

  return { subject, text };
}

export function orderConfirmationEmail(params: {
  orderId: string;
  items: { name: string; quantity: number; unitPriceCents: number }[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}): { subject: string; text: string } {
  const subject = `Order confirmed — ${params.orderId}`;

  const lines = params.items.map(
    (item) => `  ${item.quantity} x ${item.name} — ${formatCents(item.unitPriceCents * item.quantity)}`
  );

  const text = [
    `Thanks for your order!`,
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
