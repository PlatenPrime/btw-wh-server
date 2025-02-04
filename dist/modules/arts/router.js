import { Router } from "express";
import { getAllArts, getArtById } from "./controllers/index.js";
const router = Router();
router.get("/", getAllArts);
router.get("/:id", getArtById);
export default router;
