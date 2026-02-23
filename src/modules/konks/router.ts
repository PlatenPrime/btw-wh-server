import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createKonkController,
  deleteKonkByIdController,
  getAllKonksController,
  getKonkByIdController,
  getKonkByNameController,
  updateKonkByIdController,
} from "./controllers/index.js";

const router = Router();

router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getAllKonksController)
);
router.get(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getKonkByIdController)
);
router.get(
  "/name/:name",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getKonkByNameController)
);
router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(createKonkController)
);
router.patch(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updateKonkByIdController)
);
router.delete(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.PRIME]),
  asyncHandler(deleteKonkByIdController)
);

export default router;
