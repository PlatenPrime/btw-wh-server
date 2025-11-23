import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { deleteArtsWithoutLatestMarkerController, exportArtsToExcelController, exportArtsToExcelWithStocksController, getAllArtsController, getArtController, getArtByIdController, getArtsByZoneController, getBtradeArtInfoController, updateAllBtradeStocksController, updateArtLimitController, updateBtradeStockController, upsertArtsController, } from "./controllers/index.js";
const router = Router();
// Получить все артикулы - доступно для всех авторизованных пользователей
router.get("/", checkAuth, checkRoles([RoleType.USER]), getAllArtsController);
// Получить артикулы по зоне - доступно для всех авторизованных пользователей
router.get("/zone/:zone", checkAuth, checkRoles([RoleType.USER]), getArtsByZoneController);
// Получить артикул по ID - доступно для всех авторизованных пользователей
router.get("/id/:id", checkAuth, checkRoles([RoleType.USER]), getArtByIdController);
// Получить артикул по номеру - доступно для всех авторизованных пользователей
router.get("/artikul/:artikul", checkAuth, checkRoles([RoleType.USER]), getArtController);
// Получить информацию из Btrade - доступно для всех авторизованных пользователей
router.get("/btrade/:artikul", checkAuth, checkRoles([RoleType.USER]), getBtradeArtInfoController);
// Обновить лимит артикула - доступно для ADMIN и PRIME
router.patch("/:id/limit", checkAuth, checkRoles([RoleType.ADMIN]), updateArtLimitController);
// Создать/обновить артикулы - доступно для ADMIN и PRIME
router.post("/upsert", checkAuth, checkRoles([RoleType.ADMIN]), upsertArtsController);
// Обновить btradeStock для одного артикула - доступно только для ADMIN
router.patch("/:artikul/btrade-stock", checkAuth, checkRoles([RoleType.ADMIN]), updateBtradeStockController);
// Обновить btradeStock для всех артикулов - доступно только для ADMIN
router.post("/btrade-stock/update-all", checkAuth, checkRoles([RoleType.ADMIN]), updateAllBtradeStocksController);
// Экспортировать все артикулы в Excel - доступно только для ADMIN
router.get("/export", checkAuth, checkRoles([RoleType.ADMIN]), exportArtsToExcelController);
// Экспортировать все артикулы в Excel с данными о запасах и витрине - доступно только для ADMIN
router.get("/export-with-stocks", checkAuth, checkRoles([RoleType.ADMIN]), exportArtsToExcelWithStocksController);
// Удалить все артикулы без последнего актуального маркера - доступно только для PRIME
router.delete("/without-latest-marker", checkAuth, checkRoles([RoleType.PRIME]), deleteArtsWithoutLatestMarkerController);
export default router;
