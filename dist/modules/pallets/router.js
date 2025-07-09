import { Router } from "express";
import { createPallet, deletePallet, getAllPallets, getPalletById, updatePallet, } from "./controllers/index.js";
const router = Router();
router.post("/", createPallet);
router.get("/", getAllPallets);
router.get("/:id", getPalletById);
router.put("/:id", updatePallet);
router.delete("/:id", deletePallet);
export default router;
