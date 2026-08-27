import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { BuilderPage } from "./pages/BuilderPage";
import { ProductPage } from "./pages/ProductPage";
import { SetupPage } from "./pages/SetupPage";
import { SetupRestorePage } from "./pages/SetupRestorePage";
import { ActivatedPage } from "./pages/ActivatedPage";
import { SupportPage } from "./pages/SupportPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { useCartStore } from "./store/cartStore";

export default function App() {
  const refresh = useCartStore((s) => s.refresh);

  // The cart itself isn't persisted (only cartId is, see store/cartStore.ts)
  // so on a hard reload/direct navigation the header's item count would
  // otherwise stay at 0 until a page that happens to call refresh() (setup)
  // is visited. Do it once, here, for every page.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
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
  );
}
