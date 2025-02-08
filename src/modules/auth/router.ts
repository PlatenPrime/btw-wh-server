import { Router } from "express";
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

// Роуты для пользователей
router.get("/users", getAllUsers);
router.get("/users/:id", async (req, res) => {
  try {
    await getUserById(req, res);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/me/:id", async (req, res) => {
  try {
    await getMe(req, res);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.put("/users/:userId", async (req, res) => {
  try {
    await updateUserInfo(req, res);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Роут для авторизации
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

// Роуты для ролей
router.get("/roles", getAllRoles);

export default router;
