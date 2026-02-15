import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createDelController,
  deleteDelByIdController,
  getAllDelsController,
  getDelByIdController,
  updateDelArtikulByDelIdController,
  updateDelArtikulsByDelIdController,
  updateDelTitleByIdController,
} from "./controllers/index.js";

const router = Router();

router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getAllDelsController)
);
router.get(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getDelByIdController)
);
router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(createDelController)
);
router.delete(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.PRIME]),
  asyncHandler(deleteDelByIdController)
);
router.patch(
  "/:id/title",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updateDelTitleByIdController)
);
router.patch(
  "/:id/artikuls/:artikul",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updateDelArtikulByDelIdController)
);
router.post(
  "/:id/artikuls/update-all",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updateDelArtikulsByDelIdController)
);

export default router;
