import { Request, Response } from "express";
import Found from "../models/Found.js";

export const createFound = async (req: Request, res: Response) => {
  const newfound = new Found(req.body);
  const found = await newfound.save();
  res.json(found);
};
