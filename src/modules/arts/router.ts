import { Router } from "express";
import { getAllArts, getArtById } from "./controllers";

const router = Router();

router.get("/", getAllArts);

router.get("/:id", getArtById);

export default router;
