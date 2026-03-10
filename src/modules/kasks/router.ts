import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createKaskController,
  deleteKaskById,
  getKaskById,
  getKasksByDate,
  updateKaskById,
} from "./controllers/index.js";

const router = Router();

router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(createKaskController)
);

router.get(
  "/by-date",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getKasksByDate)
);

router.get(
  "/:id",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getKaskById)
);

router.patch(
  "/:id",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(updateKaskById)
);

router.delete(
  "/:id",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(deleteKaskById)
);

export default router;
