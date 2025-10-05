import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createPallet,
  deletePallet,
  deletePalletEmptyPoses,
  deletePalletPoses,
  getAllPallets,
  getAllPalletsByRowId,
  getEmptyPallets,
  getPalletById,
  getPalletByTitle,
  movePalletPoses,
  updatePallet,
} from "./controllers/index.js";

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
router.delete("/:id/empty-poses", asyncHandler(deletePalletEmptyPoses));
router.post("/move-poses", asyncHandler(movePalletPoses));

export default router;
