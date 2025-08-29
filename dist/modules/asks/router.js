import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createAsk, getAskById, getAsksByDate } from "./controllers/index.js";
const router = Router();
router.post("/", asyncHandler(createAsk));
router.get("/by-date", asyncHandler(getAsksByDate));
router.get("/:id", asyncHandler(getAskById));
export default router;
