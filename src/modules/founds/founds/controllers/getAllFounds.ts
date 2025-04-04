import { Request, Response } from "express";
import Found from "../models/Found.js";

export const getAllFounds = async (req: Request, res: Response) => {
  const founds = await Found.find();
  res.json(founds);
};
