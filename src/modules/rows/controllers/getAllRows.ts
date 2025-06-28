import { Request, Response } from "express";
import { Row } from "../models/Row.js";

export const getAllRows = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rows = await Row.find().sort({ title: 1 });
    if (!rows || rows.length === 0) {
      res.status(404).json({ message: "Rows not found" });
      return;
    }
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
