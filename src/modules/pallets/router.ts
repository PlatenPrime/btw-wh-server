import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createPallet,
  deletePallet,
  deletePalletEmptyPoses,
  deletePalletPoses,
  getAllPallets,
  getAllPalletsByRowId,
  getEmptyPallets,
  getPalletById,
  getPalletByTitle,
  movePalletPoses,
  updatePallet,
} from "./controllers/index.js";

const router = Router();

// GET роуты - доступно для всех авторизованных пользователей
router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getAllPallets)
);
router.get(
  "/empty",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getEmptyPallets)
);
router.get(
  "/by-row/:rowId",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getAllPalletsByRowId)
);
router.get(
  "/by-title/:title",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getPalletByTitle)
);
router.get(
  "/:id",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getPalletById)
);

// POST роуты - доступно для ADMIN и PRIME
router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(createPallet)
);
router.post(
  "/move-poses",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(movePalletPoses)
);

// PUT роуты - доступно для ADMIN и PRIME
router.put(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updatePallet)
);

// DELETE роуты - доступно для ADMIN и PRIME
router.delete(
  "/:id",
  checkAuth,
  checkRoles([RoleType.PRIME]),
  asyncHandler(deletePallet)
);
router.delete(
  "/:id/poses",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(deletePalletPoses)
);
router.delete(
  "/:id/empty-poses",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(deletePalletEmptyPoses)
);

export default router;
