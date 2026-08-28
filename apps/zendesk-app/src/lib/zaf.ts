// Thin wrapper around the Zendesk Apps Framework (ZAF) v2 client, loaded
// globally by the <script> tag in iframe.html (see docs/zendesk-app.md).

interface ZafClientInstance {
  get(path: string): Promise<Record<string, unknown>>;
  metadata(): Promise<{ settings: Record<string, string> }>;
  invoke(name: string, ...args: unknown[]): Promise<unknown>;
}

declare global {
  interface Window {
    ZAFClient?: { init: () => ZafClientInstance };
  }
}

export interface ZafContext {
  ticketId: string;
  requesterEmail: string | null;
  apiBaseUrl: string;
  internalToken: string;
  // Ticket sidebar iframes are a fixed height by default -- call this
  // after any render that changes content height, passing the measured
  // height (e.g. document.body.scrollHeight), so the sidebar grows/shrinks
  // instead of scrolling inside a cramped box.
  resize: (heightPx: number) => void;
}

// apiBaseUrl and internalToken are ZAF "parameters" (see manifest.json),
// set once per install via Zendesk's app-installation UI -- never
// committed to source.
export async function initZaf(): Promise<ZafContext> {
  if (!window.ZAFClient) {
    throw new Error("ZAF SDK not loaded -- this app must run inside a Zendesk ticket sidebar.");
  }
  const client = window.ZAFClient.init();
  const [ticketData, requesterData, metadata] = await Promise.all([
    client.get("ticket.id"),
    // Not every ticket has a requester (e.g. some internal/test tickets) --
    // tolerate that rather than failing the whole app over it.
    client.get("ticket.requester.email").catch((): Record<string, unknown> => ({})),
    client.metadata(),
  ]);

  const ticketId = String(ticketData["ticket.id"] ?? "");
  if (!ticketId) throw new Error("Couldn't read the current ticket id.");

  const requesterEmail = requesterData["ticket.requester.email"]
    ? String(requesterData["ticket.requester.email"])
    : null;

  const apiBaseUrl = String(metadata.settings.apiBaseUrl ?? "").replace(/\/+$/, "");
  const internalToken = String(metadata.settings.internalToken ?? "");
  if (!apiBaseUrl || !internalToken) {
    throw new Error("apiBaseUrl / internalToken aren't configured for this app install.");
  }

  const resize = (heightPx: number) => {
    client.invoke("resize", { width: "100%", height: `${Math.ceil(heightPx)}px` }).catch(() => {});
  };

  return { ticketId, requesterEmail, apiBaseUrl, internalToken, resize };
}
