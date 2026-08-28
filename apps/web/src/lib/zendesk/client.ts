import { env } from "../env";

// Ticket <-> customer resolution is handled via our own SupportTicket table
// (see app/api/internal/*), not a Zendesk custom field -- that would require
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

  const url = `${baseUrl()}/tickets.json`;
  console.log(
    `[zendesk] createTicket -> POST ${url} (subdomain=${env.zendesk.subdomain}, email=${env.zendesk.email}, brand_id=${env.zendesk.brandId || "unset -- falls back to account default brand"})`
  );

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket: {
          subject: params.subject,
          comment: { body: params.body },
          requester: { email: params.requesterEmail },
          tags: ["xlsmart_support", `customer_${params.customerId}`],
          ...(env.zendesk.brandId ? { brand_id: Number(env.zendesk.brandId) } : {}),
        },
      }),
    });

    console.log(`[zendesk] createTicket <- ${res.status} (response.url=${res.url})`);

    if (!res.ok) {
      console.error(`[zendesk] createTicket failed: ${res.status} ${await res.text()}`);
      return null;
    }

    const data = (await res.json()) as { ticket: { id: number; url: string } };
    console.log(`[zendesk] createTicket created ticket ${data.ticket.id} at ${data.ticket.url}`);
    return String(data.ticket.id);
  } catch (err) {
    console.error("[zendesk] createTicket error", err);
    return null;
  }
}

// Zendesk statuses: new | open | pending | hold | solved | closed. Closed
// is terminal -- Zendesk rejects further comments/reopens on it, so a
// customer whose last ticket landed there needs a fresh one, not a reuse.
export async function getTicketStatus(ticketId: string): Promise<string | null> {
  if (!isConfigured()) return null;

  try {
    const res = await fetch(`${baseUrl()}/tickets/${ticketId}.json`, {
      headers: { Authorization: authHeader() },
    });
    if (!res.ok) {
      // 404 -- e.g. the ticket belongs to a different Zendesk account than
      // the one currently configured -- treat the same as "can't reuse it".
      console.error(`[zendesk] getTicketStatus failed: ${res.status} ${await res.text()}`);
      return null;
    }
    const data = (await res.json()) as { ticket: { status: string } };
    return data.ticket.status;
  } catch (err) {
    console.error("[zendesk] getTicketStatus error", err);
    return null;
  }
}

export async function addTicketComment(ticketId: string, body: string): Promise<void> {
  if (!isConfigured()) {
    console.warn(`[zendesk] not configured -- skipping comment on ticket ${ticketId}`);
    return;
  }

  const url = `${baseUrl()}/tickets/${ticketId}.json`;
  console.log(`[zendesk] addTicketComment -> PUT ${url} (subdomain=${env.zendesk.subdomain})`);

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ ticket: { comment: { body, public: false } } }),
    });

    console.log(`[zendesk] addTicketComment <- ${res.status}`);

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
