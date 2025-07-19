import { Router } from "express";
import { bulkCreatePoses, createPos, deletePos, getAllPoses, getPosById, getPosesByPalletId, getPosesByRowId, updatePos, } from "./controllers/index.js";
import { populateMissingPosData } from "./controllers/populateMissingPosData.js";
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const router = Router();
// GET routes
router.get("/", getAllPoses);
router.get("/:id", getPosById);
router.get("/by-pallet/:palletId", getPosesByPalletId);
router.get("/by-row/:rowId", getPosesByRowId);
// POST routes
router.post("/", createPos);
router.post("/bulk", bulkCreatePoses);
router.post("/populate-missing-data", asyncHandler(populateMissingPosData));
// PUT routes
router.put("/:id", updatePos);
// DELETE routes
router.delete("/:id", deletePos);
export default router;
