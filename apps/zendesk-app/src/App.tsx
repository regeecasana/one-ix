// Placeholder root component -- see docs/zendesk-app.md and docs/roadmap.md Phase 3.
//
// Intended shape once implemented:
//   - On mount: initialize the ZAF client (window.ZAFClient.init()), read
//     ticket.customField:cart_id (fallback: GET /internal/tickets/:id/cart)
//   - Fetch GET /internal/carts/:cartId/summary, render cart + coupon state
//   - "Send 20% coupon" button -> POST /internal/carts/:cartId/coupons
export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <p>oneix sidebar app — not yet implemented. See docs/roadmap.md.</p>
    </div>
  );
}
