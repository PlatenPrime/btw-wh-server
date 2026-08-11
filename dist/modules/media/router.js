import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getSharikArtImageController } from "./controllers/get-sharik-art-image/getSharikArtImageController.js";
const router = Router();
router.get("/sharik/:artikul", asyncHandler(getSharikArtImageController));
export default router;
