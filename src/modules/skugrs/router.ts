import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  clearSkugrSkusController,
  createSkugrController,
  deleteSkugrByIdController,
  deleteSkugrWithSkusController,
  fillSkugrSkusController,
  getAirClientSkugrPendingController,
  getAllSkugrsController,
  getSkugrByIdController,
  postAirClientFillPageController,
  setIsSlicedController,
  updateSkugrByIdController,
} from "./controllers/index.js";

const router = Router();

router.get(
  "/client/air/pending",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getAirClientSkugrPendingController),
);
router.post(
  "/client/air/id/:id/fill-page",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(postAirClientFillPageController),
);
router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getAllSkugrsController),
);
router.get(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getSkugrByIdController),
);
router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(createSkugrController),
);
router.post(
  "/id/:id/fill-skus",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(fillSkugrSkusController),
);
router.post(
  "/set-is-sliced",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(setIsSlicedController),
);
router.patch(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updateSkugrByIdController),
);
router.post(
  "/id/:id/clear-skus",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(clearSkugrSkusController),
);
router.delete(
  "/id/:id/with-skus",
  checkAuth,
  checkRoles([RoleType.PRIME]),
  asyncHandler(deleteSkugrWithSkusController),
);
router.delete(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.PRIME]),
  asyncHandler(deleteSkugrByIdController),
);

export default router;
