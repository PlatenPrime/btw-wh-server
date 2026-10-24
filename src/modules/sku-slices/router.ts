import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  correctBandSpikeController,
  discoverBandSpikeController,
  getAirClientPendingController,
  getPackFlipReviewController,
  getSkuSliceByDateController,
  getSkuSliceController,
  getSkuSliceDayInvalidController,
  getSkuSliceDayStatusController,
  getSkuSliceRangeController,
  patchSkuSliceByDateController,
  postSkuSlicePostCorrectionsController,
  putAirClientSkuSliceController,
  runSkugrSlicesTodayController,
} from "./controllers/index.js";

const router = Router();

router.get("/", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getSkuSliceController));
router.get(
  "/day-status",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkuSliceDayStatusController),
);
router.get(
  "/day-invalid",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkuSliceDayInvalidController),
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
  "/pack-flips",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getPackFlipReviewController),
);
router.post(
  "/skugr/:skugrId/run-today",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(runSkugrSlicesTodayController),
);
router.post(
  "/post-corrections/run",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(postSkuSlicePostCorrectionsController),
);
router.post(
  "/band-spike/discover",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(discoverBandSpikeController),
);
router.get(
  "/sku/:skuId/range",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkuSliceRangeController),
);
router.post(
  "/sku/:skuId/correct-band-spike",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(correctBandSpikeController),
);
router.get(
  "/sku/:skuId",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkuSliceByDateController),
);
router.patch(
  "/sku/:skuId",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(patchSkuSliceByDateController),
);

export default router;
