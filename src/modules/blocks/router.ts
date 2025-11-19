import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createBlock,
  deleteBlock,
  getAllBlocks,
  getBlockById,
  resetZonesSectors,
  updateBlock,
} from "./controllers/index.js";

const router = Router();

// Создать блок - доступно только для ADMIN
router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(createBlock)
);

// Получить все блоки - доступно только для ADMIN
router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getAllBlocks)
);

// Получить блок по ID - доступно только для ADMIN
router.get(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getBlockById)
);

// Обновить блок - доступно только для ADMIN
router.put(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updateBlock)
);

// Удалить блок - доступно только для ADMIN
router.delete(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(deleteBlock)
);

// Разовый контроллер: сбросить сектора всех зон - доступно только для ADMIN
router.post(
  "/reset-zones-sectors",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(resetZonesSectors)
);

export default router;

