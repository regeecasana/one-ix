// Placeholder root component -- see docs/zendesk-app.md and docs/roadmap.md Phase 4.
//
// Intended shape once implemented:
//   - On mount: initialize the ZAF client (window.ZAFClient.init()), read
//     ticket.id, resolve it via GET /internal/tickets/:id/customer
//   - Fetch GET /internal/customers/:customerId/profile, render the
//     interaction timeline (latest cart, recent events, active voucher)
//   - "Issue voucher" / "Resend voucher" actions ->
//     POST /internal/customers/:customerId/vouchers,
//     POST /internal/vouchers/:voucherId/resend
//   - "Close ticket" action -> POST /internal/tickets/:id/close
export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <p>oneix sidebar app — not yet implemented. See docs/roadmap.md.</p>
    </div>
  );
}
