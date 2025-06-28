import { Router } from "express";
import { getAllRows } from "./controllers/index.js";
const router = Router();
router.get("/", getAllRows);
export default router;
