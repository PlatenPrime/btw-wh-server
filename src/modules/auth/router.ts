import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import {
  getAllRoles,
  getAllUsers,
  getMe,
  getUserById,
  login,
  registrateUser,
  updateUserInfo,
} from "./controllers/index.js";

const router = Router();

// Публичные роуты (без авторизации)
router.post("/login", login);

router.post("/register", registrateUser);

// Защищенные роуты (требуют авторизации)

// Получить всех пользователей - доступно для ADMIN и PRIME
router.get("/users", checkAuth, checkRoles([RoleType.ADMIN]), getAllUsers);

// Получить пользователя по ID - доступно для всех авторизованных
router.get("/users/:id", checkAuth, checkRoles([RoleType.USER]), getUserById);

// Получить информацию о себе - доступно для всех авторизованных
router.get("/me/:id", checkAuth, checkRoles([RoleType.USER]), getMe);

// Обновить информацию пользователя - доступно для ADMIN и PRIME
router.put("/users/:userId", checkAuth, checkRoles([RoleType.ADMIN]), updateUserInfo);

// Получить все роли - доступно для ADMIN и PRIME
router.get("/roles", checkAuth, checkRoles([RoleType.ADMIN]), getAllRoles);

export default router;
