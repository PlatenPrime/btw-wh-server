import { Router } from "express";
import { createPallet, deletePallet, getAllPallets, getAllPalletsByRowId, getPalletById, movePalletPoses, updatePallet, } from "./controllers/index.js";
const router = Router();
router.post("/", createPallet);
router.get("/", getAllPallets);
router.get("/by-row/:rowId", async (req, res) => {
    await getAllPalletsByRowId(req, res);
});
router.get("/:id", getPalletById);
router.put("/:id", updatePallet);
router.delete("/:id", deletePallet);
router.post("/move-poses", movePalletPoses);
export default router;
