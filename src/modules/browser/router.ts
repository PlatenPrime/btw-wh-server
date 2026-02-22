import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getSharikStockController } from "./sharik/controllers/index.js";
import { getSharteStockController } from "./sharte/controllers/index.js";

const router = Router();

router.get(
  "/sharte/stock/:id",
  asyncHandler(getSharteStockController)
);
router.get(
  "/sharik/stock/:artikul",
  asyncHandler(getSharikStockController)
);

export default router;
