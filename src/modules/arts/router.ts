import { Router } from "express";
import {
  getAllArts,
  getArt,
  getArtById,
  getBtradeArtInfo,
  updateArtLimit,
  upsertArts,
} from "./controllers/index.js";

const router = Router();

router.get("/", getAllArts);

router.get("/id/:id", getArtById);

router.get("/artikul/:artikul", getArt);

router.get("/btrade/:artikul", getBtradeArtInfo);

router.patch("/:id/limit", updateArtLimit);

router.post("/upsert", (req, res, next) => upsertArts(req, res, next));

export default router;
