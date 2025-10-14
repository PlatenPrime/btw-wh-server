import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import {
  getAllArts,
  getArt,
  getArtById,
  getBtradeArtInfo,
  updateArtLimit,
  upsertArts,
} from "./controllers/index.js";

const router = Router();

// Получить все артикулы - доступно для всех авторизованных пользователей
router.get("/", checkAuth, checkRoles([RoleType.USER]), getAllArts);

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
router.post(
  "/upsert",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  (req, res, next) => upsertArts(req, res, next)
);

export default router;
