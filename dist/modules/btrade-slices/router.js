import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getBtradeSliceController, getBtradeSliceRangeController, } from "./controllers/index.js";
const router = Router();
router.get("/artikul/:artikul/range", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getBtradeSliceRangeController));
router.get("/", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getBtradeSliceController));
export default router;
