import { Router } from "express";
import { getAllRows, getRowById, getRowByTitle } from "./controllers/index.js";

const router = Router();

router.get("/", getAllRows);
router.get("/id/:id", getRowById);
router.get("/title/:title", getRowByTitle);

export default router;
