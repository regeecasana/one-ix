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
// `GET /contacts/identifiers/{key}/{value}` (read-by-identifier) returns
// a blanket 403 no matter the identifier type (email, externalId, etc.)
// or how permissive the AccessKey's policies are -- confirmed by testing
// with a key its own owner describes as having full access. A PATCH to
// the same path works fine (that's how upsertContact's conflict fallback
// works above), but PATCHing a *nonexistent* identifier silently creates
// a new contact (201) rather than 404ing, so it can't safely stand in
// for a read -- using it as a "does this exist" check would pollute the
// workspace with a junk contact on every failed lookup. Instead,
// getContactByEmail lists+paginates `GET /contacts` (plain list, same
// pattern as bird/objects.ts's searchObjects) and matches client-side.
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

// Caps how many pages of the workspace's full contact list this will
// scan looking for a match -- read-by-identifier being forbidden (see
// file header) means this is a linear scan, not a real lookup. Fine at
// this app's own contact volume; a workspace with many thousands of
// *unrelated* contacts (this one already has some, e.g. from other
// integrations) could in the worst case not find a match within the cap.
const MAX_CONTACT_LIST_PAGES = 20;
const CONTACT_LIST_PAGE_SIZE = 100;

export async function getContactByEmail(email: string): Promise<BirdContact | null> {
  if (!isConfigured()) return null;

  let pageToken: string | undefined;
  try {
    for (let page = 0; page < MAX_CONTACT_LIST_PAGES; page++) {
      const url = new URL(`${baseUrl()}/workspaces/${env.bird.workspaceId}/contacts`);
      url.searchParams.set("limit", String(CONTACT_LIST_PAGE_SIZE));
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const res = await fetch(url, { headers: { Authorization: authHeader() } });
      if (!res.ok) {
        console.error(`[bird] getContactByEmail failed: ${res.status} ${await res.text()}`);
        return null;
      }

      const data = (await res.json()) as { results: ContactResponse[]; nextPageToken?: string };
      const match = data.results.find((c) =>
        c.featuredIdentifiers?.some((i) => i.key === "emailaddress" && i.value === email)
      );
      if (match) return contactFromResponse(match, email);

      if (!data.nextPageToken) return null;
      pageToken = data.nextPageToken;
    }
    return null;
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

// Contact event tracking is a completely separate mechanism from the rest
// of this file -- confirmed empirically (2026-09) against a live
// workspace. It's not part of the Contacts REST API at all (that gave a
// blanket 403 with a fully-privileged AccessKey, which was the tell that
// it needed a different credential entirely, not a permission fix). It's
// Bird's client-SDK tracking pipeline instead:
// - Auth is `X-Bird-Write-Key: <writeKey>`, not the workspace AccessKey.
//   Get the write key from Developer -> Applications -> your app -> Event
//   Tracking (must be toggled ON -- off gives an all-zeros placeholder
//   key) -> fetch the app's `data-config-url` (from "Bird SDK Code
//   Snippet") and read `tracking.writeKey`/`tracking.endpoint` from the
//   JSON it returns.
// - The endpoint is a different host per region, e.g.
//   `https://capture.eu-west-1.nest.messagebird.com/tracking/track`
//   (legacy messagebird.com domain, not api.bird.com or platform.bird.com).
// - Confirmed working (200 "ok") with `X-Bird-Workspace-Id`,
//   `X-Bird-Event-Name`, `X-Bird-Sdk-Version: 0.0.1` headers and a body
//   of `{ identifiers: [{ key, value }], properties }`.
// NOT yet confirmed: `listEventsForContact` below (GET
// /contacts/{id}/events on api.bird.com -- no longer 403 once tracking
// was enabled, but returns an empty result even a while after a
// successful track call) -- either an indexing delay, or events tracked
// this way land somewhere `listEventsForContact`'s endpoint doesn't read
// from. Re-verify once you can watch it over a longer window.
export async function trackEvent(params: {
  contactId: string;
  eventName: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}): Promise<BirdEvent | null> {
  const createdAt = (params.timestamp ?? new Date()).toISOString();

  if (!env.bird.trackingWriteKey || !env.bird.trackingEndpoint) {
    console.warn(`[bird] tracking not configured -- skipping trackEvent ${params.eventName}`);
    return null;
  }

  try {
    const res = await fetch(env.bird.trackingEndpoint, {
      method: "POST",
      headers: {
        "X-Bird-Write-Key": env.bird.trackingWriteKey,
        "X-Bird-Workspace-Id": env.bird.workspaceId,
        "X-Bird-Event-Name": params.eventName,
        "X-Bird-Sdk-Version": "0.0.1",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifiers: [{ key: "id", value: params.contactId }],
        properties: params.properties ?? {},
      }),
    });

    if (!res.ok) {
      console.error(`[bird] trackEvent failed: ${res.status} ${await res.text()}`);
      return null;
    }

    return { id: crypto.randomUUID(), contactId: params.contactId, eventName: params.eventName, properties: params.properties, createdAt };
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
