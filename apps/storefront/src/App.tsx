import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { CartRestorePage } from "./pages/CartRestorePage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderConfirmationPage } from "./pages/OrderConfirmationPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { useCartStore } from "./store/cartStore";

export default function App() {
  const refresh = useCartStore((s) => s.refresh);

  // The cart itself isn't persisted (only cartId is, see store/cartStore.ts)
  // so on a hard reload/direct navigation the header's item count would
  // otherwise stay at 0 until a page that happens to call refresh() (cart,
  // checkout) is visited. Do it once, here, for every page.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/cart/:cartId" element={<CartRestorePage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/confirmation" element={<OrderConfirmationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
