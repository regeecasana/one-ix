import { env } from "../env";
import type { BirdProduct } from "./types";

// Generic CRUD/search over Bird's Custom Objects (see docs/architecture.md
// for the migration this powers). Each object type (products, carts,
// orders, vouchers, support_tickets, activity_tickets) must already exist
// in the Bird dashboard's Custom Objects builder -- this client only
// reads/writes records, it doesn't define object schemas.
//
// Confirmed empirically against a live workspace (2026-09):
// - Host is https://api.bird.com (NOT platform.bird.com/v1 -- that's a
//   different, unrelated API surface that also happens to exist).
// - Auth header is `Authorization: AccessKey <key>` (NOT `Bearer`).
// - A record's custom fields live nested under a `body` object, not flat
//   at the top level -- e.g. a `name` field is created in the dashboard
//   with path `body.name`. `id`, `createdAt`, `updatedAt`, `indexedAt` are
//   system-provided fields on every object and are NOT set by us at
//   create time (see the note on `data` below).
// NOT YET confirmed: exact create/search endpoint paths and the `search`
// query filter syntax (still the best inference from docs, see
// ObjectFilter) -- fix these against real responses as they come in.

function isConfigured(): boolean {
  return Boolean(env.bird.apiKey && env.bird.workspaceId);
}

function baseUrl(objectName: string): string {
  return `https://api.bird.com/workspaces/${env.bird.workspaceId}/catalog/objects/${objectName}`;
}

function authHeader(): string {
  return `AccessKey ${env.bird.apiKey}`;
}

// createdAt/updatedAt are system-managed (see file header) -- callers in
// this codebase still pass them along for historical/demo-seeding
// purposes, but they must not be sent as custom `body` fields (Bird would
// either reject them as unknown attributes or silently ignore them,
// depending on schema strictness). Strip them before every write.
function toBody(data: Record<string, unknown>): Record<string, unknown> {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = data;
  return rest;
}

function fromRecord<T extends { id: string }>(record: {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  body?: Record<string, unknown>;
}): T {
  return { id: record.id, createdAt: record.createdAt, updatedAt: record.updatedAt, ...record.body } as unknown as T;
}

export type ObjectFilter = { attribute: string; operator: "string/equals" | "number/equals"; value: string | number };

export async function createObject<T extends { id: string }>(
  objectName: string,
  data: Record<string, unknown>
): Promise<T | null> {
  if (!isConfigured()) {
    console.warn(`[bird] not configured -- skipping create on ${objectName}`);
    return null;
  }

  const url = baseUrl(objectName);
  console.log(`[bird] createObject -> POST ${url}`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ body: toBody(data) }),
    });

    console.log(`[bird] createObject <- ${res.status}`);

    if (!res.ok) {
      console.error(`[bird] createObject(${objectName}) failed: ${res.status} ${await res.text()}`);
      return null;
    }

    const record = (await res.json()) as { id: string; createdAt?: string; updatedAt?: string; body?: Record<string, unknown> };
    return fromRecord<T>(record);
  } catch (err) {
    console.error(`[bird] createObject(${objectName}) error`, err);
    return null;
  }
}

export async function updateObject<T extends { id: string }>(
  objectName: string,
  id: string,
  data: Record<string, unknown>
): Promise<T | null> {
  if (!isConfigured()) {
    console.warn(`[bird] not configured -- skipping update on ${objectName}/${id}`);
    return null;
  }

  const url = `${baseUrl(objectName)}/${id}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ body: toBody(data) }),
    });

    if (!res.ok) {
      console.error(`[bird] updateObject(${objectName}) failed: ${res.status} ${await res.text()}`);
      return null;
    }

    const record = (await res.json()) as { id: string; createdAt?: string; updatedAt?: string; body?: Record<string, unknown> };
    return fromRecord<T>(record);
  } catch (err) {
    console.error(`[bird] updateObject(${objectName}) error`, err);
    return null;
  }
}

export async function getObject<T extends { id: string }>(objectName: string, id: string): Promise<T | null> {
  if (!isConfigured()) return null;

  const url = `${baseUrl(objectName)}/${id}`;

  try {
    const res = await fetch(url, { headers: { Authorization: authHeader() } });
    if (!res.ok) {
      if (res.status !== 404) {
        console.error(`[bird] getObject(${objectName}) failed: ${res.status} ${await res.text()}`);
      }
      return null;
    }
    const record = (await res.json()) as { id: string; createdAt?: string; updatedAt?: string; body?: Record<string, unknown> };
    return fromRecord<T>(record);
  } catch (err) {
    console.error(`[bird] getObject(${objectName}) error`, err);
    return null;
  }
}

// Confirmed empirically (2026-09) against a live workspace: a plain
// `GET .../catalog/objects/{name}` (NOT `POST .../search`, which is a
// different, apparently unrelated endpoint) lists records, response
// shape `{ results: [{ id, body, createdAt, updatedAt, ... }],
// nextPageToken? }` -- matches fromRecord() below. This GET works even
// on object types where POST create currently fails with a server-side
// 500 (cart_items/order_items/support_tickets/activity_tickets as of
// this writing) -- reads and writes appear to hit different code paths
// on Bird's side. NOT confirmed: any server-side filter query param --
// a `?body.x=y` guess was silently ignored (returned everything
// regardless), so this fetches one page and filters client-side in JS
// instead of risking silently-wrong results.
// NOT handled: pagination beyond the first page (`nextPageToken` is
// returned but unused) -- fine at this app's data scale (tens of
// records per object type); revisit if that stops being true.
export async function searchObjects<T extends { id: string }>(
  objectName: string,
  filters: ObjectFilter[],
  limit = 100
): Promise<T[]> {
  if (!isConfigured()) return [];

  const url = `${baseUrl(objectName)}?limit=${limit}`;

  try {
    const res = await fetch(url, { headers: { Authorization: authHeader() } });

    if (!res.ok) {
      console.error(`[bird] searchObjects(${objectName}) failed: ${res.status} ${await res.text()}`);
      return [];
    }

    const data = (await res.json()) as {
      results: { id: string; createdAt?: string; updatedAt?: string; body?: Record<string, unknown> }[];
    };
    const records = data.results.map((r) => fromRecord<T>(r));
    return records.filter((record) =>
      filters.every((f) => (record as Record<string, unknown>)[f.attribute] === f.value)
    );
  } catch (err) {
    console.error(`[bird] searchObjects(${objectName}) error`, err);
    return [];
  }
}

export async function deleteObject(objectName: string, id: string): Promise<void> {
  if (!isConfigured()) return;

  const url = `${baseUrl(objectName)}/${id}`;

  try {
    const res = await fetch(url, { method: "DELETE", headers: { Authorization: authHeader() } });
    if (!res.ok && res.status !== 404) {
      console.error(`[bird] deleteObject(${objectName}) failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error(`[bird] deleteObject(${objectName}) error`, err);
  }
}

// Fetches matches for `filters` and returns the one with the newest
// createdAt -- Bird's search API sort support is unconfirmed (see file
// header), so this sorts client-side rather than relying on the server.
export async function findLatest<T extends { id: string; createdAt: string }>(
  objectName: string,
  filters: ObjectFilter[]
): Promise<T | null> {
  const results = await searchObjects<T>(objectName, filters);
  if (results.length === 0) return null;
  return results.reduce((latest, r) => (r.createdAt > latest.createdAt ? r : latest));
}

// Product ids used everywhere else in this app (recommendation logic,
// cart/order/voucher items, the storefront) are the stable `slug`, not
// Bird's own auto-assigned record id -- see the note on BirdProduct in
// ./types.ts. This is the one product-specific exception in an otherwise
// generic file, because that lookup is needed in enough places
// (checkout, cart items, voucher issuance, the product detail route) to
// be worth not repeating.
export async function getProductBySlug(slug: string): Promise<BirdProduct | null> {
  const results = await searchObjects<BirdProduct>("products", [
    { attribute: "slug", operator: "string/equals", value: slug },
  ]);
  return results[0] ?? null;
}
