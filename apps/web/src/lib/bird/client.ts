import { env } from "../env";

// Bird (app.bird.com) is the CDP backing customer identity + interaction
// events -- see docs/architecture.md for the migration this replaced
// MongoDB/Prisma with. This client is scaffolded ahead of having live
// credentials, so every call is guarded by isConfigured() and fails soft
// (logs + returns null/void) exactly like ../zendesk/client.ts does for
// the same reason.
//
// Host + auth + Contacts wire shape confirmed empirically against a live
// workspace (2026-09) via `POST /workspaces/{id}/contacts`:
// - https://api.bird.com, `Authorization: AccessKey <key>` (NOT
//   platform.bird.com, NOT Bearer -- see the note in ../bird/objects.ts).
// - The email identifier's key is `"emailaddress"`, not `"email"`.
// - Creating a contact requires a top-level `displayName` field.
// - The response has `attributes` FLAT at the top level (unlike Custom
//   Object records, which nest custom fields under `body`) plus
//   `featuredIdentifiers` (not `identifiers`) and top-level `createdAt`/
//   `updatedAt` strings.
// Also confirmed: a second create for an already-used identifier gets a
// `409 ResourceAlreadyExists`, so upsertContact falls back to
// `PATCH /contacts/identifiers/emailaddress/{email}` in that case (also
// confirmed working, 200, and does update the contact's attributes).
// And: Bird does NOT URL-decode identifier path segments -- an
// encodeURIComponent'd email (e.g. "%40" for "@") gets rejected as "not a
// valid email address". The email must go into these URLs raw.
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
  return `https://api.bird.com`;
}

function authHeader(): string {
  return `AccessKey ${env.bird.apiKey}`;
}

type ContactResponse = {
  id: string;
  featuredIdentifiers?: { key: string; value: string }[];
  attributes?: Record<string, unknown>;
  createdAt?: string;
};

function contactFromResponse(data: ContactResponse, fallbackEmail?: string): BirdContact {
  const email = data.featuredIdentifiers?.find((i) => i.key === "emailaddress")?.value ?? fallbackEmail ?? "";
  return {
    id: data.id,
    email,
    name: (data.attributes?.firstName as string) ?? null,
    activeTicketId: (data.attributes?.activeTicketId as string) ?? null,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
}

function contactAttributes(params: { name?: string; activeTicketId?: string | null }): Record<string, unknown> {
  return {
    ...(params.name ? { firstName: params.name } : {}),
    ...(params.activeTicketId !== undefined ? { activeTicketId: params.activeTicketId } : {}),
  };
}

async function updateContactByEmail(params: {
  email: string;
  name?: string;
  activeTicketId?: string | null;
}): Promise<BirdContact | null> {
  const url = `${baseUrl()}/workspaces/${env.bird.workspaceId}/contacts/identifiers/emailaddress/${params.email}`;
  console.log(`[bird] updateContactByEmail -> PATCH ${url}`);

  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ attributes: contactAttributes(params) }),
  });

  console.log(`[bird] updateContactByEmail <- ${res.status}`);

  if (!res.ok) {
    console.error(`[bird] updateContactByEmail failed: ${res.status} ${await res.text()}`);
    return null;
  }

  const data = (await res.json()) as ContactResponse;
  return contactFromResponse(data, params.email);
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

  const url = `${baseUrl()}/workspaces/${env.bird.workspaceId}/contacts`;
  console.log(`[bird] upsertContact -> POST ${url}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: params.name || params.email,
        identifiers: [{ key: "emailaddress", value: params.email }],
        attributes: contactAttributes(params),
      }),
    });

    console.log(`[bird] upsertContact <- ${res.status}`);

    if (res.status === 409) {
      return await updateContactByEmail(params);
    }

    if (!res.ok) {
      console.error(`[bird] upsertContact failed: ${res.status} ${await res.text()}`);
      return null;
    }

    const data = (await res.json()) as ContactResponse;
    return contactFromResponse(data, params.email);
  } catch (err) {
    console.error("[bird] upsertContact error", err);
    return null;
  }
}

export async function getContactByEmail(email: string): Promise<BirdContact | null> {
  if (!isConfigured()) return null;

  const url = `${baseUrl()}/workspaces/${env.bird.workspaceId}/contacts/identifiers/emailaddress/${email}`;

  try {
    const res = await fetch(url, { headers: { Authorization: authHeader() } });
    if (!res.ok) {
      if (res.status !== 404) {
        console.error(`[bird] getContactByEmail failed: ${res.status} ${await res.text()}`);
      }
      return null;
    }
    const data = (await res.json()) as ContactResponse;
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
    const data = (await res.json()) as ContactResponse;
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
