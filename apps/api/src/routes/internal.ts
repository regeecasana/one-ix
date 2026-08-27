import { Router } from "express";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { asyncHandler } from "../middleware/asyncHandler";
import { internalAuth } from "../middleware/internalAuth";
import { serializeVoucher } from "../serializers";
import { buildCustomerProfile } from "../services/profileService";
import { issueVoucher, resendVoucher } from "../services/voucherService";
import { closeTicket } from "../zendesk/client";

const router = Router();

// Everything below requires X-Internal-Token -- called only by the Zendesk
// sidebar app. See docs/api-spec.md.
router.use(internalAuth);

router.get(
  "/tickets/:ticketId/customer",
  asyncHandler(async (req, res) => {
    const { ticketId } = req.params;

    const customer = await prisma.customer.findFirst({ where: { activeTicketId: ticketId } });
    if (customer) {
      res.json({ customerId: customer.id });
      return;
    }

    // Fall back to the standalone support-ticket flow, which isn't
    // reconciled with the per-customer activity ticket -- see
    // docs/api-spec.md.
    const supportTicket = await prisma.supportTicket.findFirst({
      where: { zendeskTicketId: ticketId },
      orderBy: { createdAt: "desc" },
    });
    if (!supportTicket) throw new HttpError(404, "customer_not_found_for_ticket");
    res.json({ customerId: supportTicket.customerId });
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
  "/customers/:customerId/vouchers",
  asyncHandler(async (req, res) => {
    const productId = String(req.body?.productId ?? "");
    if (!productId) throw new HttpError(400, "product_id_required");

    const voucher = await issueVoucher({
      customerId: req.params.customerId,
      productId,
      percentOff: req.body?.percentOff ? Number(req.body.percentOff) : undefined,
      ttlMinutes: req.body?.ttlMinutes ? Number(req.body.ttlMinutes) : undefined,
    });

    res.status(201).json(serializeVoucher(voucher));
  })
);

router.post(
  "/vouchers/:voucherId/resend",
  asyncHandler(async (req, res) => {
    const voucher = await resendVoucher(
      req.params.voucherId,
      req.body?.ttlMinutes ? Number(req.body.ttlMinutes) : undefined
    );
    res.json(serializeVoucher(voucher));
  })
);

router.post(
  "/tickets/:ticketId/close",
  asyncHandler(async (req, res) => {
    await closeTicket(req.params.ticketId);
    await prisma.customer.updateMany({
      where: { activeTicketId: req.params.ticketId },
      data: { activeTicketId: null },
    });
    res.json({ closed: true });
  })
);

export default router;
