import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getBtradeSliceController } from "./controllers/index.js";

const router = Router();

router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getBtradeSliceController)
);

export default router;
