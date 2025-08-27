import { Router } from "express";
import { getAllArts, getArt, getArtById, getBtradeArtInfo, upsertArts, } from "./controllers/index.js";
const router = Router();
router.get("/", getAllArts);
router.get("/id/:id", getArtById);
router.get("/artikul/:artikul", getArt);
router.get("/btrade/:artikul", getBtradeArtInfo);
router.post("/upsert", (req, res, next) => upsertArts(req, res, next));
export default router;
