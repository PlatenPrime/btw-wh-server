import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  cancelExcelJobController,
  createExcelJobController,
  downloadExcelJobFileController,
  getExcelJobController,
  listExcelJobsController,
} from "./controllers/index.js";

const router = Router();

router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(createExcelJobController),
);
router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(listExcelJobsController),
);
router.get("/:id/file", asyncHandler(downloadExcelJobFileController));
router.get(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getExcelJobController),
);
router.delete(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(cancelExcelJobController),
);

export default router;
