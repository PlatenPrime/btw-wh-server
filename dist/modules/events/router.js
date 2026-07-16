import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getAllEventsController, getEventByIdController, } from "./controllers/index.js";
const router = Router();
router.get("/", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getAllEventsController));
router.get("/id/:id", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getEventByIdController));
export default router;
