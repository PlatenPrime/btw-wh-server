import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import {
  bulkCreatePoses,
  createPos,
  deletePos,
  getAllPoses,
  getPosById,
  getPosesByArtikul,
  getPosesByPalletId,
  getPosesByRowId,
  updatePos,
  populateMissingPosData,
} from "./controllers/index.js";

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

// GET routes - доступно для всех авторизованных пользователей
router.get("/", checkAuth, checkRoles([RoleType.USER]), getAllPoses);
router.get("/:id", checkAuth, checkRoles([RoleType.USER]), getPosById);
router.get(
  "/by-artikul/:artikul",
  checkAuth,
  checkRoles([RoleType.USER]),
  asyncHandler(getPosesByArtikul)
);
router.get(
  "/by-pallet/:palletId",
  checkAuth,
  checkRoles([RoleType.USER]),
  getPosesByPalletId
);
router.get(
  "/by-row/:rowId",
  checkAuth,
  checkRoles([RoleType.USER]),
  getPosesByRowId
);

// POST routes - доступно для ADMIN и PRIME
router.post("/", checkAuth, checkRoles([RoleType.ADMIN]), createPos);
router.post("/bulk", checkAuth, checkRoles([RoleType.ADMIN]), bulkCreatePoses);
router.post(
  "/populate-missing-data",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(populateMissingPosData)
);

// PUT routes - доступно для ADMIN и PRIME
router.put("/:id", checkAuth, checkRoles([RoleType.ADMIN]), updatePos);

// DELETE routes - доступно для ADMIN и PRIME
router.delete("/:id", checkAuth, checkRoles([RoleType.ADMIN]), deletePos);

export default router;
