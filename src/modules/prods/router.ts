import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createProdController,
  deleteProdByIdController,
  getAllProdsController,
  getProdByIdController,
  getProdByNameController,
  updateProdByIdController,
} from "./controllers/index.js";

const router = Router();

router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getAllProdsController)
);
router.get(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getProdByIdController)
);
router.get(
  "/name/:name",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getProdByNameController)
);
router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(createProdController)
);
router.patch(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updateProdByIdController)
);
router.delete(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.PRIME]),
  asyncHandler(deleteProdByIdController)
);

export default router;
