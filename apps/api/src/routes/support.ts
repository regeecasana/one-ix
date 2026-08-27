import { Router } from "express";
import rateLimit from "express-rate-limit";
import { HttpError } from "../errors";
import { asyncHandler } from "../middleware/asyncHandler";
import { submitSupportTicket } from "../services/supportService";
import { serializeSupportTicket } from "../serializers";

const router = Router();

// Each submission creates a real Zendesk ticket -- cap abuse.
const supportTicketLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/tickets",
  supportTicketLimiter,
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const subject = String(req.body?.subject ?? "").trim();
    const message = String(req.body?.message ?? "").trim();

    if (!email) throw new HttpError(400, "email_required");
    if (!subject) throw new HttpError(400, "subject_required");
    if (!message) throw new HttpError(400, "message_required");

    const ticket = await submitSupportTicket({ email, subject, message });
    res.status(201).json(serializeSupportTicket(ticket));
  })
);

export default router;
