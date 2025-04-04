import express from "express";
import { getAllFounds, getFoundBySlug, createFound, deleteFoundById } from "./controllers/index.js";  

const router = express.Router();

router.get("/", getAllFounds);
router.get("/:slug", getFoundBySlug);
router.post("/", createFound);
router.delete("/:id", deleteFoundById);

export default router;
