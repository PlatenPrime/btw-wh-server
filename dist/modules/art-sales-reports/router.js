import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getArtSalesByDateController, getArtSalesRangeController, } from "./controllers/index.js";
const router = Router();
router.get("/artikul/:artikul/by-date", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getArtSalesByDateController));
router.get("/artikul/:artikul/range", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getArtSalesRangeController));
export default router;
