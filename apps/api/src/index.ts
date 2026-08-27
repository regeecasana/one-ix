// Must load before any other import -- several modules (env.ts in
// particular) read process.env at import time, and Docker/Render inject
// env vars directly so this is a no-op there, but plain `npm run dev`
// needs apps/api/.env actually loaded into process.env first.
import "dotenv/config";

import { createApp } from "./app";
import { env } from "./env";

const app = createApp();

// Bind 0.0.0.0, not just localhost -- required for the port mapping in
// infra/docker-compose.yml to reach the process inside the container.
app.listen(env.port, "0.0.0.0", () => {
  console.log(`oneix api listening on :${env.port}`);
});
