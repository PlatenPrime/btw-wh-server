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
router.post("/login", async (req, res) => {
  try {
    await login(req, res);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    await registrateUser(req, res);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Защищенные роуты (требуют авторизации)

// Получить всех пользователей - доступно для ADMIN и PRIME
router.get("/users", checkAuth, checkRoles([RoleType.ADMIN]), getAllUsers);

// Получить пользователя по ID - доступно для всех авторизованных
router.get(
  "/users/:id",
  checkAuth,
  checkRoles([RoleType.USER]),
  async (req, res) => {
    try {
      await getUserById(req, res);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Получить информацию о себе - доступно для всех авторизованных
router.get(
  "/me/:id",
  checkAuth,
  checkRoles([RoleType.USER]),
  async (req, res) => {
    try {
      await getMe(req, res);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Обновить информацию пользователя - доступно для ADMIN и PRIME
router.put(
  "/users/:userId",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  async (req, res) => {
    try {
      await updateUserInfo(req, res);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Получить все роли - доступно для ADMIN и PRIME
router.get("/roles", checkAuth, checkRoles([RoleType.ADMIN]), getAllRoles);

export default router;
