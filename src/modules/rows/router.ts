import { Request, Response, Router } from "express";
import {
  createRow,
  deleteRow,
  getAllRows,
  getRowById,
  getRowByTitle,
  updateRow,
} from "./controllers/index.js";

const router = Router();

router.get("/", getAllRows);
router.get("/id/:id", getRowById);
router.get("/title/:title", getRowByTitle);

router.post("/", createRow);

router.put("/:id", async (req: Request, res: Response) => {
  await updateRow(req, res);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await deleteRow(req, res);
});

export default router;
