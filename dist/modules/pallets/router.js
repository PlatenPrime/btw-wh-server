import { Router } from "express";
import { createPallet, deletePallet, getAllPallets, getAllPalletsByRowId, getPalletById, movePalletPoses, updatePallet, } from "./controllers/index.js";
const router = Router();
router.post("/", createPallet);
router.get("/", getAllPallets);
router.get("/by-row/:rowId", async (req, res) => {
    try {
        await getAllPalletsByRowId(req, res);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
router.get("/:id", getPalletById);
router.put("/:id", updatePallet);
router.delete("/:id", deletePallet);
router.post("/move-poses", movePalletPoses);
export default router;
