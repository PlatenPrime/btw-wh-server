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

const router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post("/", asyncHandler(createPallet));
router.get("/", asyncHandler(getAllPallets));
router.get("/empty", asyncHandler(getEmptyPallets));
router.get("/by-row/:rowId", async (req, res) => {
  await getAllPalletsByRowId(req, res);
});
router.get("/by-title/:title", asyncHandler(getPalletByTitle));
router.get("/:id", asyncHandler(getPalletById));
router.put("/:id", asyncHandler(updatePallet));
router.delete("/:id", asyncHandler(deletePallet));
router.delete("/:id/poses", asyncHandler(deletePalletPoses));
router.post("/move-poses", asyncHandler(movePalletPoses));

export default router;
