import { Router } from "express";
import { createAsk } from "./controllers/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
const router = Router();
router.post("/", asyncHandler(createAsk));
export default router;
