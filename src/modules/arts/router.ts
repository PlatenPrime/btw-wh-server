import { Router } from "express";
import { getAllArts, getArt, getArtById } from "./controllers/index.js";

const router = Router();

router.get("/", getAllArts);

router.get("/id/:id", getArtById);

router.get("/artikul/:artikul", getArt);

export default router;
