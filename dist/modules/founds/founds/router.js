import { Router } from "express";
import { createFound, deleteFoundById, getAllFounds, getFoundBySlug, } from "./controllers/index.js";
const router = Router();
router.get("/", getAllFounds);
router.get("/:slug", getFoundBySlug);
router.post("/", createFound);
router.delete("/:id", deleteFoundById);
export default router;
