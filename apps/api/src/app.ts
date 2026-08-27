import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { env } from "./env";
import { HttpError } from "./errors";
import productsRouter from "./routes/products";
import cartsRouter from "./routes/carts";
import couponsRouter from "./routes/coupons";
import internalRouter from "./routes/internal";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.storefrontUrl }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/products", productsRouter);
  app.use("/api/carts", cartsRouter);
  app.use("/api/coupons", couponsRouter);
  app.use("/api/internal", internalRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  });

  return app;
}
