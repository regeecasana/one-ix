import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { recommendPlan } from "../services/recommendationService";

const router = Router();

router.post(
  "/recommend",
  asyncHandler(async (req, res) => {
    const devices = String(req.body?.devices ?? "");
    const priority = String(req.body?.priority ?? "");
    const recommendation = recommendPlan(req.body?.usage, devices, priority);
    res.json(recommendation);
  })
);

export default router;
