import { env } from "../env";

// Bird (app.bird.com) is the CDP backing customer identity + interaction
// events -- see docs/architecture.md for the migration this replaced
// MongoDB/Prisma with. This client is scaffolded ahead of having live
// credentials, so every call is guarded by isConfigured() and fails soft
// (logs + returns null/void) exactly like ../zendesk/client.ts does for
// the same reason.
//
// Endpoint shapes below follow Bird's documented resource model (workspace-
// scoped contacts addressed by identifier, e.g. email; a contact event
// stream keyed to a contact) but have NOT been verified against a live
// workspace or Bird's OpenAPI spec -- docs.bird.com's API reference pages
// are client-rendered and couldn't be fully confirmed during research.
// TODO: once BIRD_API_KEY/BIRD_WORKSPACE_ID are available, verify these
// paths and request bodies against a real workspace before relying on them.
//
// Bird's own contact `id` is the canonical "customerId" everywhere else in
// this app (carts, orders, vouchers, support tickets all store it as a
// plain string field) -- there's no separate app-side id to bridge to now
// that Prisma is gone.

export interface BirdContact {
  id: string;
  email: string;
  name: string | null;
  activeTicketId: string | null;
  createdAt: string;
}

export interface BirdEvent {
  id: string;
  contactId: string;
  eventName: string;
  properties?: Record<string, unknown>;
  createdAt: string;
}

function isConfigured(): boolean {
  return Boolean(env.bird.apiKey && env.bird.workspaceId);
}

function baseUrl(): string {
  return `https://${env.bird.region}.platform.bird.com/v1`;
}

function authHeader(): string {
  return `Bearer ${env.bird.apiKey}`;
}

function contactFromResponse(
  data: { id: string; identifiers?: { key: string; value: string }[]; attributes?: Record<string, unknown> },
  fallbackEmail?: string
): BirdContact {
  const email = data.identifiers?.find((i) => i.key === "email")?.value ?? fallbackEmail ?? "";
  return {
    id: data.id,
    email,
    name: (data.attributes?.firstName as string) ?? null,
    activeTicketId: (data.attributes?.activeTicketId as string) ?? null,
    createdAt: (data.attributes?.createdAt as string) ?? new Date().toISOString(),
  };
}

export async function upsertContact(params: {
  email: string;
  name?: string;
  activeTicketId?: string | null;
}): Promise<BirdContact | null> {
  if (!isConfigured()) {
    console.warn(`[bird] not configured -- skipping contact upsert for ${params.email}`);
    return null;
  }

  const url = `${baseUrl()}/workspaces/${env.bird.workspaceId}/contacts/identifiers/email/${encodeURIComponent(params.email)}`;
  console.log(`[bird] upsertContact -> PATCH ${url}`);

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        identifiers: [{ key: "email", value: params.email }],
        attributes: {
          ...(params.name ? { firstName: params.name } : {}),
          ...(params.activeTicketId !== undefined ? { activeTicketId: params.activeTicketId } : {}),
        },
      }),
    });

    console.log(`[bird] upsertContact <- ${res.status}`);

    if (!res.ok) {
      console.error(`[bird] upsertContact failed: ${res.status} ${await res.text()}`);
      return null;
    }

    const data = (await res.json()) as {
      id: string;
      identifiers?: { key: string; value: string }[];
      attributes?: Record<string, unknown>;
    };
    return contactFromResponse(data, params.email);
  } catch (err) {
    console.error("[bird] upsertContact error", err);
    return null;
  }
}

export async function getContactByEmail(email: string): Promise<BirdContact | null> {
  if (!isConfigured()) return null;

  const url = `${baseUrl()}/workspaces/${env.bird.workspaceId}/contacts/identifiers/email/${encodeURIComponent(email)}`;

  try {
    const res = await fetch(url, { headers: { Authorization: authHeader() } });
    if (!res.ok) {
      if (res.status !== 404) {
        console.error(`[bird] getContactByEmail failed: ${res.status} ${await res.text()}`);
      }
      return null;
    }
    const data = (await res.json()) as {
      id: string;
      identifiers?: { key: string; value: string }[];
      attributes?: Record<string, unknown>;
    };
    return contactFromResponse(data, email);
  } catch (err) {
    console.error("[bird] getContactByEmail error", err);
    return null;
  }
}

export async function getContactById(contactId: string): Promise<BirdContact | null> {
  if (!isConfigured()) return null;

  const url = `${baseUrl()}/workspaces/${env.bird.workspaceId}/contacts/${contactId}`;

  try {
    const res = await fetch(url, { headers: { Authorization: authHeader() } });
    if (!res.ok) {
      if (res.status !== 404) {
        console.error(`[bird] getContactById failed: ${res.status} ${await res.text()}`);
      }
      return null;
    }
    const data = (await res.json()) as {
      id: string;
      identifiers?: { key: string; value: string }[];
      attributes?: Record<string, unknown>;
    };
    return contactFromResponse(data);
  } catch (err) {
    console.error("[bird] getContactById error", err);
    return null;
  }
}

export async function trackEvent(params: {
  contactId: string;
  eventName: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}): Promise<BirdEvent | null> {
  const createdAt = (params.timestamp ?? new Date()).toISOString();

  if (!isConfigured()) {
    console.warn(`[bird] not configured -- skipping trackEvent ${params.eventName}`);
    return null;
  }

  const url = `${baseUrl()}/workspaces/${env.bird.workspaceId}/contacts/${params.contactId}/events`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ name: params.eventName, properties: params.properties ?? {}, createdAt }),
    });

    if (!res.ok) {
      console.error(`[bird] trackEvent failed: ${res.status} ${await res.text()}`);
      return null;
    }

    const data = (await res.json()) as { id: string };
    return { id: data.id, contactId: params.contactId, eventName: params.eventName, properties: params.properties, createdAt };
  } catch (err) {
    console.error("[bird] trackEvent error", err);
    return null;
  }
}

export async function listEventsForContact(contactId: string, limit = 20): Promise<BirdEvent[]> {
  if (!isConfigured()) return [];

  const url = `${baseUrl()}/workspaces/${env.bird.workspaceId}/contacts/${contactId}/events?limit=${limit}`;

  try {
    const res = await fetch(url, { headers: { Authorization: authHeader() } });
    if (!res.ok) {
      console.error(`[bird] listEventsForContact failed: ${res.status} ${await res.text()}`);
      return [];
    }
    const data = (await res.json()) as {
      results: { id: string; name: string; properties?: Record<string, unknown>; createdAt: string }[];
    };
    return data.results.map((e) => ({
      id: e.id,
      contactId,
      eventName: e.name,
      properties: e.properties,
      createdAt: e.createdAt,
    }));
  } catch (err) {
    console.error("[bird] listEventsForContact error", err);
    return [];
  }
}
