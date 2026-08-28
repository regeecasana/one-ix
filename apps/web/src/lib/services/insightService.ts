import type { CustomerProfile } from "@oneix/shared";
import { env } from "../env";
import { HttpError } from "../errors";

// "Ticket data" in this system's terms *is* the CustomerProfile -- every
// interaction event mirrored onto the Zendesk ticket as a comment is
// already captured here in structured form (see InteractionEvent /
// docs/data-model.md), so summarizing the profile is equivalent to
// summarizing the ticket's real content without a second fetch back to
// Zendesk's own API.
function buildPrompt(profile: CustomerProfile): string {
  const lines: string[] = [];
  lines.push(`Customer: ${profile.customer.email}${profile.customer.name ? ` (${profile.customer.name})` : ""}`);

  if (profile.latestCart) {
    const itemNames = profile.latestCart.items
      .map((item) => `${item.quantity}x ${profile.latestCart!.products[item.productId]?.name ?? item.productId}`)
      .join(", ");
    lines.push(`Latest setup (${profile.latestCart.status}): ${itemNames || "empty"}`);
    if (profile.latestCart.recommendationReason) {
      lines.push(`Recommended because: ${profile.latestCart.recommendationReason}`);
    }
  } else {
    lines.push("No setup saved yet.");
  }

  if (profile.latestOrder) {
    lines.push(`Activated: order ${profile.latestOrder.id}, Rp ${profile.latestOrder.totalCents.toLocaleString("id-ID")}/mo.`);
  }

  if (profile.activeVoucher) {
    lines.push(`Active voucher: ${profile.activeVoucher.code}, ${profile.activeVoucher.percentOff}% off, expires ${profile.activeVoucher.expiresAt}.`);
  } else if (profile.latestVoucher) {
    lines.push(`Most recent voucher (${profile.latestVoucher.status}): ${profile.latestVoucher.code}, ${profile.latestVoucher.percentOff}% off.`);
  }

  if (profile.recentEvents.length > 0) {
    lines.push("Recent activity (newest first):");
    for (const event of profile.recentEvents.slice(0, 15)) {
      lines.push(`  - [${event.createdAt}] ${event.detail}`);
    }
  }

  return lines.join("\n");
}

const SYSTEM_PROMPT = [
  "You are assisting a customer support agent at XLSmart, an Indonesian telco.",
  "You'll be given one customer's activity summary: their saved connectivity setup, any voucher history, and a recent-activity timeline.",
  "Write a brief, actionable insight (2-4 sentences, plain prose, no headers or bullet points) that helps the agent decide whether and how to help this customer.",
  "Focus on purchase-intent signals (what they were close to buying, where they dropped off, how recently) and end with one concrete recommended next step.",
  "Do not invent facts not present in the summary.",
].join(" ");

export async function generateInsight(profile: CustomerProfile): Promise<string> {
  if (!env.openaiApiKey) {
    throw new HttpError(503, "insights_not_configured");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(profile) },
      ],
    }),
  });

  if (!res.ok) {
    console.error(`[insight] OpenAI request failed: ${res.status} ${await res.text()}`);
    throw new HttpError(502, "insight_generation_failed");
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new HttpError(502, "insight_generation_failed");
  return text;
}
