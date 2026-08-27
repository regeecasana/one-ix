"use client";

import { useEffect } from "react";
import { EmailPopup } from "./EmailPopup";
import { useCartStore } from "../store/cartStore";

// "Customer closed the tab" -- best-effort, only capturable via pagehide /
// visibilitychange, and only worth reporting once an identity (and
// therefore a ticket to comment on) exists. If not yet identified, buffer
// it like any other pre-identify event so it still reaches the ticket once
// the popup resolves an email.
function useTabCloseTracking() {
  useEffect(() => {
    let reported = false;
    function report() {
      if (reported) return;
      const { cartId, customerId, sessionToken } = useCartStore.getState();
      if (!cartId && !customerId) return; // nothing happened worth reporting
      reported = true;
      const detail = "Customer closed the tab";
      if (customerId && sessionToken) {
        const payload = JSON.stringify({ type: "closed_tab", detail, sessionToken });
        navigator.sendBeacon?.(
          `/api/customers/${customerId}/interactions`,
          new Blob([payload], { type: "application/json" })
        );
      } else {
        useCartStore.setState((s) => ({ pendingEvents: [...s.pendingEvents, { type: "closed_tab", detail }] }));
      }
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") report();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", report);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", report);
    };
  }, []);
}

// Mounted once in the root layout. Rehydrates the persisted cart store
// (skipped automatically on the server -- see store/cartStore.ts), then
// refreshes the live cart and wires up tab-close tracking + the email
// popup for every page.
export function ClientProviders() {
  const refresh = useCartStore((s) => s.refresh);
  useTabCloseTracking();

  useEffect(() => {
    // refresh() reads cartId from the store, so it must run after
    // rehydration actually lands, not just after rehydrate() is called.
    Promise.resolve(useCartStore.persist.rehydrate()).then(() => refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <EmailPopup />;
}
