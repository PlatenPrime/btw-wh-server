import { Router } from "express";
import {
  createPallet,
  deletePallet,
  deletePalletPoses,
  getAllPallets,
  getAllPalletsByRowId,
  getEmptyPallets,
  getPalletById,
  getPalletByTitle,
  movePalletPoses,
  updatePallet,
} from "./controllers/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();



router.post("/", asyncHandler(createPallet));
router.get("/", asyncHandler(getAllPallets));
router.get("/empty", asyncHandler(getEmptyPallets));
router.get("/by-row/:rowId", asyncHandler(getAllPalletsByRowId));
router.get("/by-title/:title", asyncHandler(getPalletByTitle));
router.get("/:id", asyncHandler(getPalletById));
router.put("/:id", asyncHandler(updatePallet));
router.delete("/:id", asyncHandler(deletePallet));
router.delete("/:id/poses", asyncHandler(deletePalletPoses));
router.post("/move-poses", asyncHandler(movePalletPoses));

export default router;
