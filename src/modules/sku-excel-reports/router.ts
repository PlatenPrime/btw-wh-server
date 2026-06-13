import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getCatalogInvalidExcelController,
  getCatalogNewSinceExcelController,
  getKonkSkuSalesExcelController,
  getKonkSkuStockSliceExcelController,
  getSkugrSalesExcelController,
  getSkugrSliceExcelController,
  getSkuSalesExcelController,
  getSkuStockSliceExcelController,
} from "./controllers/index.js";

const router = Router();

router.get(
  "/catalog/new-since",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getCatalogNewSinceExcelController),
);
router.get(
  "/catalog/invalid",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getCatalogInvalidExcelController),
);
router.get(
  "/konk/stock",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getKonkSkuStockSliceExcelController),
);
router.get(
  "/konk/sales",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getKonkSkuSalesExcelController),
);
router.get(
  "/skugr/:skugrId/stock",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkugrSliceExcelController),
);
router.get(
  "/skugr/:skugrId/sales",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkugrSalesExcelController),
);
router.get(
  "/sku/:skuId/stock",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkuStockSliceExcelController),
);
router.get(
  "/sku/:skuId/sales",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkuSalesExcelController),
);

export default router;
