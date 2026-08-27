import { Router } from "express";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { asyncHandler } from "../middleware/asyncHandler";
import { internalAuth } from "../middleware/internalAuth";
import { serializeCustomer } from "../serializers";
import { buildCustomerProfile } from "../services/profileService";
import { grantGoodwillPoints } from "../services/pointsService";
import { runCdpSweep } from "../jobs/cdpSweep";

const router = Router();

// Everything below requires X-Internal-Token -- called only by the Zendesk
// sidebar app (and, for force-sweep, the demo operator). See docs/api-spec.md.
router.use(internalAuth);

router.get(
  "/tickets/:ticketId/customer",
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.findFirst({
      where: { zendeskTicketId: req.params.ticketId },
      orderBy: { createdAt: "desc" },
    });
    if (!ticket) throw new HttpError(404, "customer_not_found_for_ticket");
    res.json({ customerId: ticket.customerId });
  })
);

router.get(
  "/customers/:customerId/profile",
  asyncHandler(async (req, res) => {
    const profile = await buildCustomerProfile(req.params.customerId);
    res.json(profile);
  })
);

router.post(
  "/customers/:customerId/points",
  asyncHandler(async (req, res) => {
    const amount = Number(req.body?.amount);
    const reason = String(req.body?.reason ?? "").trim();
    if (!reason) throw new HttpError(400, "reason_required");

    const customer = await grantGoodwillPoints({
      customerId: req.params.customerId,
      amount,
      reason,
      zendeskTicketId: req.body?.zendeskTicketId ? String(req.body.zendeskTicketId) : null,
    });

    res.json(serializeCustomer(customer));
  })
);

router.post(
  "/demo/force-sweep",
  asyncHandler(async (_req, res) => {
    const result = await runCdpSweep();
    res.json(result);
  })
);

export default router;
