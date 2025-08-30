import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createAsk,
  deleteAskById,
  getAskById,
  getAsksByDate,
  updateAskById,
} from "./controllers/index.js";

const router = Router();

router.post("/", asyncHandler(createAsk));

router.get("/by-date", asyncHandler(getAsksByDate));

router.get("/:id", asyncHandler(getAskById));

router.put("/:id", asyncHandler(updateAskById));

router.delete("/:id", asyncHandler(deleteAskById));

export default router;
