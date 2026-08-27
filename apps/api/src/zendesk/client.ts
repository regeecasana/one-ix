import { env } from "../env";

// Ticket <-> customer resolution is handled via our own SupportTicket table
// (see routes/internal.ts), not a Zendesk custom field -- that would require
// a field ID configured per Zendesk account, which we don't have at scaffold
// time. The customer_<id> tag below is just for a human glancing at the ticket.

function isConfigured(): boolean {
  return Boolean(env.zendesk.subdomain && env.zendesk.email && env.zendesk.apiToken);
}

function authHeader(): string {
  const token = Buffer.from(`${env.zendesk.email}/token:${env.zendesk.apiToken}`).toString("base64");
  return `Basic ${token}`;
}

function baseUrl(): string {
  return `https://${env.zendesk.subdomain}.zendesk.com/api/v2`;
}

export async function createTicket(params: {
  requesterEmail: string;
  subject: string;
  body: string;
  customerId: string;
}): Promise<string | null> {
  if (!isConfigured()) {
    console.warn(`[zendesk] not configured -- skipping ticket creation for customer ${params.customerId}`);
    return null;
  }

  try {
    const res = await fetch(`${baseUrl()}/tickets.json`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket: {
          subject: params.subject,
          comment: { body: params.body },
          requester: { email: params.requesterEmail },
          tags: ["xlsmart_support", `customer_${params.customerId}`],
        },
      }),
    });

    if (!res.ok) {
      console.error(`[zendesk] createTicket failed: ${res.status} ${await res.text()}`);
      return null;
    }

    const data = (await res.json()) as { ticket: { id: number } };
    return String(data.ticket.id);
  } catch (err) {
    console.error("[zendesk] createTicket error", err);
    return null;
  }
}

export async function addTicketComment(ticketId: string, body: string): Promise<void> {
  if (!isConfigured()) {
    console.warn(`[zendesk] not configured -- skipping comment on ticket ${ticketId}`);
    return;
  }

  try {
    const res = await fetch(`${baseUrl()}/tickets/${ticketId}.json`, {
      method: "PUT",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ ticket: { comment: { body, public: false } } }),
    });

    if (!res.ok) {
      console.error(`[zendesk] addComment failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error("[zendesk] addComment error", err);
  }
}

export async function closeTicket(ticketId: string): Promise<void> {
  if (!isConfigured()) {
    console.warn(`[zendesk] not configured -- skipping close on ticket ${ticketId}`);
    return;
  }

  try {
    const res = await fetch(`${baseUrl()}/tickets/${ticketId}.json`, {
      method: "PUT",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ ticket: { status: "closed" } }),
    });

    if (!res.ok) {
      console.error(`[zendesk] closeTicket failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error("[zendesk] closeTicket error", err);
  }
}
