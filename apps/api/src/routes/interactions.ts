import { Router } from "express";
import rateLimit from "express-rate-limit";
import { HttpError } from "../errors";
import { asyncHandler } from "../middleware/asyncHandler";
import { logInteraction } from "../services/interactionService";
import { serializeInteractionEvent } from "../serializers";

const router = Router();

// Generous but present -- each call posts a real Zendesk comment.
const interactionLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/:customerId/interactions",
  interactionLimiter,
  asyncHandler(async (req, res) => {
    const type = String(req.body?.type ?? "").trim();
    const detail = String(req.body?.detail ?? "").trim();
    if (!type) throw new HttpError(400, "type_required");
    if (!detail) throw new HttpError(400, "detail_required");

    const event = await logInteraction(req.params.customerId, type, detail);
    res.status(201).json(serializeInteractionEvent(event));
  })
);

export default router;
