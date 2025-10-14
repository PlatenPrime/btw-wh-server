import { Request, Response, Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import {
  createRow,
  deleteRow,
  getAllRows,
  getRowById,
  getRowByTitle,
  updateRow,
} from "./controllers/index.js";

const router = Router();

// GET роуты - доступно для всех авторизованных пользователей
router.get("/", checkAuth, checkRoles([RoleType.USER]), getAllRows);
router.get("/id/:id", checkAuth, checkRoles([RoleType.USER]), getRowById);
router.get(
  "/title/:title",
  checkAuth,
  checkRoles([RoleType.USER]),
  getRowByTitle
);

// POST роуты - доступно для ADMIN и PRIME
router.post("/", checkAuth, checkRoles([RoleType.ADMIN]), createRow);

// PUT роуты - доступно для ADMIN и PRIME
router.put(
  "/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  async (req: Request, res: Response) => {
    await updateRow(req, res);
  }
);

// DELETE роуты - доступно для ADMIN и PRIME
router.delete(
  "/:id",
  checkAuth,
  checkRoles([RoleType.PRIME]),
  async (req: Request, res: Response) => {
    await deleteRow(req, res);
  }
);

export default router;
