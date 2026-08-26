// Placeholder root component -- see docs/roadmap.md Phase 1.
//
// Intended shape once implemented:
//   - React Router routes: /, /products/:id, /cart, /checkout, /orders/:id
//   - Cart state in a zustand store (store/cart.ts), backed by POST/GET
//     /api/carts/:id so the coupon-email deep link can restore it
export default function App() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>oneix — demo store</h1>
      <p>Not yet implemented. See docs/roadmap.md.</p>
    </main>
  );
}
