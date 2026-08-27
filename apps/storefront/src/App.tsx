import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { EmailPopup } from "./components/EmailPopup";
import { HomePage } from "./pages/HomePage";
import { BuilderPage } from "./pages/BuilderPage";
import { ProductPage } from "./pages/ProductPage";
import { SetupPage } from "./pages/SetupPage";
import { SetupRestorePage } from "./pages/SetupRestorePage";
import { ActivatedPage } from "./pages/ActivatedPage";
import { SupportPage } from "./pages/SupportPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { API_BASE } from "./lib/api";
import { useCartStore } from "./store/cartStore";

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
      const { cartId, customerId } = useCartStore.getState();
      if (!cartId && !customerId) return; // nothing happened worth reporting
      reported = true;
      const detail = "Customer closed the tab";
      if (customerId) {
        const payload = JSON.stringify({ type: "closed_tab", detail });
        navigator.sendBeacon?.(
          `${API_BASE}/api/customers/${customerId}/interactions`,
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

export default function App() {
  const refresh = useCartStore((s) => s.refresh);
  useTabCloseTracking();

  // The cart itself isn't persisted (only cartId is, see store/cartStore.ts)
  // so on a hard reload/direct navigation the header's item count would
  // otherwise stay at 0 until a page that happens to call refresh() (setup)
  // is visited. Do it once, here, for every page.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/setup/:cartId" element={<SetupRestorePage />} />
          <Route path="/activated" element={<ActivatedPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <EmailPopup />
    </>
  );
}
