import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getAirStockController } from "./air/controllers/index.js";
import { getSharikStockController } from "./sharik/controllers/index.js";
import { getSharteStockController } from "./sharte/controllers/index.js";

const router = Router();

router.get(
  "/air/stock",
  asyncHandler(getAirStockController)
);
router.get(
  "/sharte/stock/:id",
  asyncHandler(getSharteStockController)
);
router.get(
  "/sharik/stock/:artikul",
  asyncHandler(getSharikStockController)
);

export default router;
