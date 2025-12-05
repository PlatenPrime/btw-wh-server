import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createBlock, deleteBlock, getAllBlocks, getBlockById, recalculateZonesSectors, renameBlock, resetZonesSectors, updateBlock, upsertBlocksController, } from "./controllers/index.js";
const router = Router();
// Создать блок - доступно только для ADMIN
router.post("/", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(createBlock));
// Получить все блоки - доступно только для ADMIN
router.get("/", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getAllBlocks));
// Получить блок по ID - доступно только для ADMIN
router.get("/:id", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getBlockById));
// Обновить блок - доступно только для ADMIN
router.put("/:id", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(updateBlock));
// Переименовать блок - доступно только для ADMIN
router.patch("/:id/rename", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(renameBlock));
// Массовый upsert блоков - доступно только для ADMIN
router.post("/upsert", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(upsertBlocksController));
// Удалить блок - доступно только для ADMIN
router.delete("/:id", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(deleteBlock));
// Разовый контроллер: сбросить сектора всех зон - доступно только для ADMIN
router.post("/reset-zones-sectors", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(resetZonesSectors));
// Пересчитать сектора всех зон на основе позиций блоков и зон - доступно только для ADMIN
router.post("/recalculate-zones-sectors", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(recalculateZonesSectors));
export default router;
