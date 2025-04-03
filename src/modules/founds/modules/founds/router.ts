import express, { Request, Response } from "express";
import Found from "./models/Found.js";
import { getAllFounds } from "./controllers/getAllFounds.js";

const router = express.Router();

router.get("/", getAllFounds);

router.get("/:slug", async (req: Request, res: Response) => {
  const founds = await Found.findById(req.params.slug);
  res.json(founds);
});

export default router;
