import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createAsk, getAsksByDate } from "./controllers/index.js";
const router = Router();
router.post("/", asyncHandler(createAsk));
router.get("/by-date", asyncHandler(getAsksByDate));
export default router;
