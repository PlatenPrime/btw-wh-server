import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getAnalogBtradeComparisonExcelController,
  getAnalogSliceByDateController,
  getAnalogSliceController,
  getAnalogSliceRangeController,
  getKonkBtradeComparisonExcelController,
} from "./controllers/index.js";

const router = Router();

router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getAnalogSliceController)
);
router.get(
  "/analog/:analogId/range",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getAnalogSliceRangeController)
);
router.get(
  "/analog/:analogId/comparison-excel",
  // checkAuth,
  // checkRoles([RoleType.USER]),
  asyncHandler(getAnalogBtradeComparisonExcelController)
);
router.get(
  "/konk-btrade/comparison-excel",
  // checkAuth,
  // checkRoles([RoleType.USER]),
  asyncHandler(getKonkBtradeComparisonExcelController)
);
router.get(
  "/analog/:analogId",
  // checkAuth,
  // checkRoles([RoleType.USER]),
  asyncHandler(getAnalogSliceByDateController)
);

export default router;
