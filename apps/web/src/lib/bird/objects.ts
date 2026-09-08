import { env } from "../env";

// Generic CRUD/search over Bird's Custom Objects (see docs/architecture.md
// for the migration this powers). Each object type (products, carts,
// orders, vouchers, support_tickets) must already exist in the Bird
// dashboard's Schema Explorer -- this client only reads/writes records,
// it doesn't define object schemas.
//
// Same caveat as ../bird/client.ts: docs.bird.com's Custom Objects API
// reference renders client-side and couldn't be fully confirmed during
// research. Confirmed from search-result snippets: POST .../search takes
// attribute filters (e.g. {"attribute": "customerId", "operator":
// "string/equals", "value": "..."}), `id` is always unique, other
// attributes can be declared unique, and create fails if a unique value
// collides. NOT confirmed: exact create/update/get URL shapes, whether
// `id` can be client-specified at create, or server-side sort support.
// TODO: verify all of the below against a live workspace once
// BIRD_API_KEY/BIRD_WORKSPACE_ID exist, and fix any wrong assumption.

function isConfigured(): boolean {
  return Boolean(env.bird.apiKey && env.bird.workspaceId);
}

function baseUrl(objectName: string): string {
  return `https://${env.bird.region}.platform.bird.com/v1/workspaces/${env.bird.workspaceId}/catalog/objects/${objectName}`;
}

function authHeader(): string {
  return `Bearer ${env.bird.apiKey}`;
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
      body: JSON.stringify({ attributes: data }),
    });

    console.log(`[bird] createObject <- ${res.status}`);

    if (!res.ok) {
      console.error(`[bird] createObject(${objectName}) failed: ${res.status} ${await res.text()}`);
      return null;
    }

    const body = (await res.json()) as { id: string; attributes: Record<string, unknown> };
    return { id: body.id, ...body.attributes } as T;
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
      body: JSON.stringify({ attributes: data }),
    });

    if (!res.ok) {
      console.error(`[bird] updateObject(${objectName}) failed: ${res.status} ${await res.text()}`);
      return null;
    }

    const body = (await res.json()) as { id: string; attributes: Record<string, unknown> };
    return { id: body.id, ...body.attributes } as T;
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
    const body = (await res.json()) as { id: string; attributes: Record<string, unknown> };
    return { id: body.id, ...body.attributes } as T;
  } catch (err) {
    console.error(`[bird] getObject(${objectName}) error`, err);
    return null;
  }
}

export async function searchObjects<T extends { id: string }>(
  objectName: string,
  filters: ObjectFilter[],
  limit = 100
): Promise<T[]> {
  if (!isConfigured()) return [];

  const url = `${baseUrl(objectName)}/search?limit=${limit}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ query: { and: filters } }),
    });

    if (!res.ok) {
      console.error(`[bird] searchObjects(${objectName}) failed: ${res.status} ${await res.text()}`);
      return [];
    }

    const body = (await res.json()) as { results: { id: string; attributes: Record<string, unknown> }[] };
    return body.results.map((r) => ({ id: r.id, ...r.attributes }) as T);
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
