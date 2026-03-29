import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createSkuController,
  deleteSkuByIdController,
  fixIncorrectSkuDataController,
  getAllSkusController,
  getSkusBySkugrIdController,
  getSkuByIdController,
  updateSkuByIdController,
} from "./controllers/index.js";

const router = Router();

router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getAllSkusController)
);
router.get(
  "/by-skugr/:skugrId",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getSkusBySkugrIdController)
);
router.get(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getSkuByIdController)
);
router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(createSkuController)
);
router.post(
  "/fix-incorrect-sku-data",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(fixIncorrectSkuDataController)
);
router.patch(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updateSkuByIdController)
);
router.delete(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.PRIME]),
  asyncHandler(deleteSkuByIdController)
);

export default router;
