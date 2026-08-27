import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { recommendPlan } from "../services/recommendationService";

const router = Router();

router.post(
  "/recommend",
  asyncHandler(async (req, res) => {
    const usage = String(req.body?.usage ?? "");
    const devices = String(req.body?.devices ?? "");
    const recommendation = recommendPlan(usage, devices);
    res.json(recommendation);
  })
);

export default router;
