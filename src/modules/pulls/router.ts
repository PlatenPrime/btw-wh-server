import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getPulls } from "./controllers/index.js";

const router = Router();

/**
 * GET /api/pulls
 * Get all calculated pulls
 * Access: ADMIN, PRIME
 */
router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN, RoleType.PRIME]),
  asyncHandler(getPulls)
);

export default router;
