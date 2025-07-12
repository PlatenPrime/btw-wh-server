import { Router } from "express";
import { bulkCreatePoses, createPos, deletePos, getAllPoses, getPosById, getPosesByPalletId, getPosesByRowId, updatePos, } from "./controllers/index.js";
const router = Router();
// GET routes
router.get("/", getAllPoses);
router.get("/:id", getPosById);
router.get("/by-pallet/:palletId", getPosesByPalletId);
router.get("/by-row/:rowId", getPosesByRowId);
// POST routes
router.post("/", createPos);
router.post("/bulk", bulkCreatePoses);
// PUT routes
router.put("/:id", updatePos);
// DELETE routes
router.delete("/:id", deletePos);
export default router;
