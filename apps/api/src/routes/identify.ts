import { Router } from "express";
import rateLimit from "express-rate-limit";
import { HttpError } from "../errors";
import { asyncHandler } from "../middleware/asyncHandler";
import { identifyCustomer } from "../services/identifyService";

const router = Router();

// Creates a real Zendesk ticket per new identity -- cap abuse.
const identifyLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/",
  identifyLimiter,
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    if (!email) throw new HttpError(400, "email_required");

    const name = req.body?.name ? String(req.body.name) : undefined;
    const cartId = req.body?.cartId ? String(req.body.cartId) : undefined;
    const bufferedEvents = Array.isArray(req.body?.bufferedEvents)
      ? req.body.bufferedEvents
          .filter((e: unknown): e is { type: unknown; detail: unknown } => typeof e === "object" && e !== null)
          .map((e: { type: unknown; detail: unknown }) => ({ type: String(e.type ?? ""), detail: String(e.detail ?? "") }))
          .filter((e: { type: string; detail: string }) => e.type && e.detail)
      : [];

    const customer = await identifyCustomer(email, { name, cartId, bufferedEvents });
    res.status(201).json({ customerId: customer.id });
  })
);

export default router;
