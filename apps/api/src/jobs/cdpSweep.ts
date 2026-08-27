import { prisma } from "../db";
import { env } from "../env";
import { etherealEmailProvider } from "../email/ethereal";
import { setupNudgeEmail } from "../email/templates";

// Act 1's automated half: saved setup, no purchase, high intent (time
// elapsed) -> a personalized nudge email. No Zendesk call here at all --
// see docs/architecture.md on why the CDP nudge and the support-ticket
// flow are independent. Sends at most once per cart (remindedAt is part
// of the query).
export async function runCdpSweep(): Promise<{ nudged: number; checkedAt: string }> {
  const cutoff = new Date(Date.now() - env.abandonThresholdMs);

  const candidates = await prisma.cart.findMany({
    where: {
      status: "active",
      customerId: { not: null },
      remindedAt: null,
      lastActivityAt: { lt: cutoff },
    },
    include: { items: true, customer: true },
  });

  let nudged = 0;

  for (const cart of candidates) {
    if (cart.items.length === 0 || !cart.customer) continue;

    const { subject, text } = setupNudgeEmail({ customerName: cart.customer.name, cartId: cart.id });

    try {
      await etherealEmailProvider.send({ to: cart.customer.email, subject, text });
    } catch (err) {
      console.error("[email] failed to send CDP nudge", err);
      continue;
    }

    await prisma.cart.update({ where: { id: cart.id }, data: { remindedAt: new Date() } });
    nudged += 1;
  }

  return { nudged, checkedAt: new Date().toISOString() };
}
