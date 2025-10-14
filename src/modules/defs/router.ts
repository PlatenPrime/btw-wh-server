import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import {
  calculatePogrebiDefsController,
  getCalculationStatusController,
  getLatestDefs,
} from "./controllers/index.js";

const router = Router();

// Маршруты для расчетов дефицитов

// Рассчитать дефициты - доступно для ADMIN и PRIME
router.post(
  "/calculate",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  calculatePogrebiDefsController
);

// Получить последние дефициты - доступно для всех авторизованных пользователей
router.get("/latest", checkAuth, checkRoles([RoleType.USER]), getLatestDefs);

// Получить статус расчета - доступно для всех авторизованных пользователей
router.get(
  "/calculation-status",
  checkAuth,
  checkRoles([RoleType.USER]),
  getCalculationStatusController
);

export default router;
