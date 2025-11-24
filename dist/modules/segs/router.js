import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createSeg, deleteSeg, getAllSegs, getSegById, getSegsByBlockId, getZonesBySegId, updateSeg, } from "./controllers/index.js";
const router = Router();
// Создать сегмент - доступно только для ADMIN
router.post("/", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(createSeg));
// Получить все сегменты - доступно только для ADMIN
router.get("/", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getAllSegs));
// Получить сегменты по ID блока - доступно только для ADMIN
router.get("/by-block/:blockId", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getSegsByBlockId));
// Получить зоны по ID сегмента - доступно только для ADMIN
router.get("/:segId/zones", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getZonesBySegId));
// Получить сегмент по ID - доступно только для ADMIN
router.get("/:id", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(getSegById));
// Обновить сегмент - доступно только для ADMIN
router.put("/:id", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(updateSeg));
// Удалить сегмент - доступно только для ADMIN
router.delete("/:id", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(deleteSeg));
export default router;
