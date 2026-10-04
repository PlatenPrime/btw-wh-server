import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getKonkProdManufacturersPieDataController,
  getKonkProdSkuSalesChartDataController,
  getKonkProdSkuStockChartDataController,
  getProdKonksPieDataController,
} from "./controllers/index.js";

const router = Router();

router.get(
  "/konk-prod/manufacturers-pie",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getKonkProdManufacturersPieDataController),
);
router.get(
  "/prod/konks-pie",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getProdKonksPieDataController),
);
router.get(
  "/konk-prod/stock",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getKonkProdSkuStockChartDataController),
);
router.get(
  "/konk-prod/sales",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getKonkProdSkuSalesChartDataController),
);

export default router;
