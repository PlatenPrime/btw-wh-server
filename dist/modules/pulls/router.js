import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getPullByPalletId, getPulls, processPullPosition, } from "./controllers/index.js";
const router = Router();
/**
 * GET /api/pulls
 * Get all calculated pulls
 * Access: ADMIN, PRIME
 */
router.get("/", checkAuth, checkRoles([RoleType.ADMIN, RoleType.PRIME]), asyncHandler(getPulls));
/**
 * GET /api/pulls/:palletId
 * Get pull for specific pallet
 * Access: ADMIN, PRIME
 */
router.get("/:palletId", checkAuth, checkRoles([RoleType.ADMIN, RoleType.PRIME]), asyncHandler(getPullByPalletId));
/**
 * PATCH /api/pulls/:palletId/positions/:posId
 * Process pull position (remove goods from position)
 * Access: ADMIN, PRIME
 */
router.patch("/:palletId/positions/:posId", checkAuth, checkRoles([RoleType.ADMIN, RoleType.PRIME]), asyncHandler(processPullPosition));
export default router;
