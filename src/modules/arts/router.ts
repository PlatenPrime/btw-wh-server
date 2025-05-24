import { Router } from "express";
import { getAllArts, getArt, getArtById } from "./controllers/index.js";
import { parseProducts } from "./controllers/getBtradeInfo.js";

const router = Router();

router.get("/", getAllArts);

router.get("/id/:id", getArtById);

router.get("/artikul/:artikul", getArt);

router.get('/parse-products', parseProducts);

export default router;
