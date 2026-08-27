import { Router } from "express";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { asyncHandler } from "../middleware/asyncHandler";
import { serializeProduct } from "../serializers";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
    res.json(products.map(serializeProduct));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) throw new HttpError(404, "product_not_found");
    res.json(serializeProduct(product));
  })
);

export default router;
