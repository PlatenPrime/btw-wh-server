import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createPalletGroup,
  deletePalletGroup,
  getAllPalletGroups,
  getFreePallets,
  getPalletGroupById,
  recalculatePalletsSectors,
  resetPalletsSectors,
  setPallets,
  unlinkPallet,
  updatePalletGroup,
} from "./controllers/index.js";

const router = Router();

// GET routes - available for all authenticated users
router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getAllPalletGroups),
);

router.get(
  "/free-pallets",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getFreePallets),
);

router.get(
  "/:id",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getPalletGroupById),
);

// POST routes - ADMIN only
router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(createPalletGroup),
);

// PUT routes - ADMIN only
router.put(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updatePalletGroup),
);

// DELETE routes - PRIME only
router.delete(
  "/:id",
  checkAuth,
  checkRoles([RoleType.PRIME]),
  asyncHandler(deletePalletGroup),
);

// Sector operations - ADMIN only
router.post(
  "/reset-pallets-sectors",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(resetPalletsSectors),
);

router.post(
  "/recalculate-pallets-sectors",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(recalculatePalletsSectors),
);

// Membership operations - ADMIN only
router.post(
  "/set-pallets",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(setPallets),
);

router.post(
  "/unlink-pallet",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(unlinkPallet),
);

export default router;
