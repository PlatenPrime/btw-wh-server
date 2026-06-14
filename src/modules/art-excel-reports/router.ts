import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getArtSalesExcelController,
  getArtStockExcelController,
} from "./controllers/index.js";

const router = Router();

router.get(
  "/artikul/:artikul/stock",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getArtStockExcelController),
);
router.get(
  "/artikul/:artikul/sales",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getArtSalesExcelController),
);

export default router;
