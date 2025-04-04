import { Request, Response } from "express";
import Found from "../models/Found.js";

export const getFoundBySlug = async (req: Request, res: Response) => {
  const found = await Found.findOne({ slug: req.params.slug });
  res.json(found);
};
