import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getKonkSkuSalesExcelController,
  getKonkSkuStockSliceExcelController,
  getSkuSalesExcelController,
  getSkuSalesByDateController,
  getSkuSalesRangeController,
  getSkuSliceByDateController,
  getSkuSliceController,
  getSkuStockSliceExcelController,
  getSkuSliceRangeController,
} from "./controllers/index.js";

const router = Router();

router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getSkuSliceController)
);
router.get(
  "/konk/excel",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getKonkSkuStockSliceExcelController)
);
router.get(
  "/konk/sales-excel",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getKonkSkuSalesExcelController)
);
router.get(
  "/sku/:skuId/range",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getSkuSliceRangeController)
);
router.get(
  "/sku/:skuId/sales-range",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getSkuSalesRangeController)
);
router.get(
  "/sku/:skuId/sales-by-date",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getSkuSalesByDateController)
);
router.get(
  "/sku/:skuId/slice-excel",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getSkuStockSliceExcelController)
);
router.get(
  "/sku/:skuId/sales-excel",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getSkuSalesExcelController)
);
router.get(
  "/sku/:skuId",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getSkuSliceByDateController)
);

export default router;
