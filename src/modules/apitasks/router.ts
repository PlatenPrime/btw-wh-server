import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  cancelApiTaskController,
  createApiTaskController,
  getApiTaskController,
  listApiTasksController,
} from "./controllers/index.js";

const router = Router();

router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.EDITOR]),
  asyncHandler(createApiTaskController),
);
router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.EDITOR]),
  asyncHandler(listApiTasksController),
);
router.get(
  "/:id",
  checkAuth,
  checkRoles([RoleType.EDITOR]),
  asyncHandler(getApiTaskController),
);
router.delete(
  "/:id",
  checkAuth,
  checkRoles([RoleType.EDITOR]),
  asyncHandler(cancelApiTaskController),
);

export default router;
