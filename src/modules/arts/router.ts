import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import {
  exportArtsToExcel,
  exportArtsToExcelWithStocks,
  getAllArts,
  getArt,
  getArtById,
  getArtsByZone,
  getBtradeArtInfo,
  updateAllBtradeStocks,
  updateArtLimit,
  updateBtradeStock,
  upsertArts,
} from "./controllers/index.js";

const router = Router();

// Получить все артикулы - доступно для всех авторизованных пользователей
router.get("/", checkAuth, checkRoles([RoleType.USER]), getAllArts);

// Получить артикулы по зоне - доступно для всех авторизованных пользователей
router.get(
  "/zone/:zone",
  checkAuth,
  checkRoles([RoleType.USER]),
  getArtsByZone
);

// Получить артикул по ID - доступно для всех авторизованных пользователей
router.get("/id/:id", checkAuth, checkRoles([RoleType.USER]), getArtById);

// Получить артикул по номеру - доступно для всех авторизованных пользователей
router.get("/artikul/:artikul", checkAuth, checkRoles([RoleType.USER]), getArt);

// Получить информацию из Btrade - доступно для всех авторизованных пользователей
router.get(
  "/btrade/:artikul",
  checkAuth,
  checkRoles([RoleType.USER]),
  getBtradeArtInfo
);

// Обновить лимит артикула - доступно для ADMIN и PRIME
router.patch(
  "/:id/limit",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  updateArtLimit
);

// Создать/обновить артикулы - доступно для ADMIN и PRIME
router.post("/upsert", checkAuth, checkRoles([RoleType.ADMIN]), upsertArts);

// Обновить btradeStock для одного артикула - доступно только для ADMIN
router.patch(
  "/:artikul/btrade-stock",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  updateBtradeStock
);

// Обновить btradeStock для всех артикулов - доступно только для ADMIN
router.post(
  "/btrade-stock/update-all",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  updateAllBtradeStocks
);

// Экспортировать все артикулы в Excel - доступно только для ADMIN
router.get(
  "/export",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  exportArtsToExcel
);

// Экспортировать все артикулы в Excel с данными о запасах и витрине - доступно только для ADMIN
router.get(
  "/export-with-stocks",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  exportArtsToExcelWithStocks
);

export default router;
