import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  bulkCreateZones,
  createZone,
  deleteZoneById,
  exportZonesToExcel,
  getAllZones,
  getZoneById,
  getZoneByTitle,
  updateZoneById,
} from "./controllers/index.js";

const router = Router();

// Создать зону - доступно только для ADMIN
router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(createZone)
);

// Получить все зоны с пагинацией и поиском - доступно только для ADMIN
router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getAllZones)
);

// Экспорт зон в Excel - доступно только для ADMIN
router.get(
  "/export",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(exportZonesToExcel)
);

// Получить зону по title - доступно только для ADMIN
router.get(
  "/title/:title",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getZoneByTitle)
);

// Получить зону по ID - доступно только для ADMIN
router.get(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getZoneById)
);

// Обновить зону - доступно только для ADMIN
router.put(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updateZoneById)
);

// Удалить зону - доступно только для ADMIN
router.delete(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(deleteZoneById)
);

// Массовое создание зон (Excel импорт) - доступно только для ADMIN
router.post(
  "/bulk",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(bulkCreateZones)
);

export default router;
