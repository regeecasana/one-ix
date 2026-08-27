// Placeholder root component -- see docs/zendesk-app.md and docs/roadmap.md Phase 4.
//
// Intended shape once implemented:
//   - On mount: initialize the ZAF client (window.ZAFClient.init()), read
//     ticket.id, resolve it via GET /internal/tickets/:id/customer
//   - Fetch GET /internal/customers/:customerId/profile, render the
//     Unified Profile (campaign source, saved setup, points, tickets)
//   - "Grant goodwill points" action -> POST /internal/customers/:customerId/points
export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <p>oneix sidebar app — not yet implemented. See docs/roadmap.md.</p>
    </div>
  );
}
