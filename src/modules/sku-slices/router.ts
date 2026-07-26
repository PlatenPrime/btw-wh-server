import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getAirClientPendingController,
  getSkuSliceByDateController,
  getSkuSliceController,
  getSkuSliceRangeController,
  putAirClientSkuSliceController,
} from "./controllers/index.js";

const router = Router();

router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkuSliceController),
);
router.get(
  "/client/air/pending",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getAirClientPendingController),
);
router.put(
  "/client/air/sku/:skuId",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(putAirClientSkuSliceController),
);
router.get(
  "/sku/:skuId/range",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkuSliceRangeController),
);
router.get(
  "/sku/:skuId",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkuSliceByDateController),
);

export default router;
