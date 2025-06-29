import { Request, Response } from "express";
import { Row } from "../models/Row.js";

export const createRow = async (req: Request, res: Response) => {
  const { title } = req.body;
  const row = new Row({ title });
  await row.save();
  res.status(201).json(row);
};