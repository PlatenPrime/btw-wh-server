import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createSkuStockBandController,
  deleteSkuStockBandByIdController,
  getSkuStockBandByIdController,
  listSkuStockBandsController,
  updateSkuStockBandByIdController,
} from "./controllers/index.js";

const router = Router();

router.get("/", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(listSkuStockBandsController));
router.get(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkuStockBandByIdController),
);
router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(createSkuStockBandController),
);
router.patch(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updateSkuStockBandByIdController),
);
router.delete(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(deleteSkuStockBandByIdController),
);

export default router;
