// Minimal placeholder server -- just enough to be runnable (incl. via
// infra/docker-compose.yml) while the real routes get built out.
// See docs/roadmap.md Phase 1 for what replaces this:
//   - Route modules: routes/products.ts, routes/carts.ts, routes/coupons.ts,
//     routes/internal.ts (see docs/api-spec.md)
//   - Background jobs: jobs/abandonedCartSweep.ts, jobs/couponExpiry.ts
//   - Zendesk client: zendesk/client.ts
//   - Email: email/provider.ts (EmailProvider interface), email/ethereal.ts
import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.STOREFRONT_URL }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Bind 0.0.0.0, not just localhost -- required for the port mapping in
// infra/docker-compose.yml to reach the process inside the container.
app.listen(port, "0.0.0.0", () => {
  console.log(`oneix api listening on :${port} (not yet implemented -- see docs/roadmap.md)`);
});
