import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { getLatestDefsController } from "./controllers/index.js";

const router = Router();

router.get("/latest", checkAuth, checkRoles([RoleType.USER]), getLatestDefsController);

export default router;
