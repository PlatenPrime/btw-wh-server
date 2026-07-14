import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { runCompensatingSliceController } from "./controllers/index.js";

const router = Router();

router.post(
  "/run",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(runCompensatingSliceController)
);

export default router;
