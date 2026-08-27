import { env } from "../env";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function setupNudgeEmail(params: {
  customerName: string | null;
  cartId: string;
}): { subject: string; text: string } {
  const link = `${env.storefrontUrl}/setup/${params.cartId}`;
  const greetingName = params.customerName ?? "there";

  const subject = "Your Creator Setup is still saved";
  const text = [
    `Hi ${greetingName} 👋`,
    ``,
    `Your Creator Setup is still saved.`,
    `Complete your activation today and receive another 5,000 XL points.`,
    ``,
    `Continue my setup: ${link}`,
  ].join("\n");

  return { subject, text };
}

export function activationConfirmationEmail(params: {
  orderId: string;
  items: { name: string; quantity: number; unitPriceCents: number }[];
  subtotalCents: number;
  totalCents: number;
  pointsEarned: number;
}): { subject: string; text: string } {
  const subject = `Your setup is active — ${params.orderId}`;

  const lines = params.items.map(
    (item) => `  ${item.quantity} x ${item.name} — ${formatCents(item.unitPriceCents * item.quantity)}`
  );

  const text = [
    `Your setup is now active!`,
    ``,
    ...lines,
    ``,
    `Subtotal: ${formatCents(params.subtotalCents)}`,
    `Total: ${formatCents(params.totalCents)}`,
    ``,
    `You earned ${params.pointsEarned.toLocaleString()} XL points on this activation.`,
    ``,
    `No real payment was processed -- this is a demo.`,
  ].join("\n");

  return { subject, text };
}

export function goodwillPointsEmail(params: {
  amount: number;
  reason: string;
  newBalance: number;
}): { subject: string; text: string } {
  const subject = `You've received ${params.amount.toLocaleString()} XL points`;
  const text = [
    `You've been granted ${params.amount.toLocaleString()} XL points: ${params.reason}`,
    ``,
    `Your new balance: ${params.newBalance.toLocaleString()} XL points.`,
  ].join("\n");

  return { subject, text };
}
