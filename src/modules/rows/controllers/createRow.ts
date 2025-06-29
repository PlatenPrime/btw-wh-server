import { Request, Response } from "express";
import { Row } from "../models/Row.js";

export const createRow = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const row = new Row({ title });
    await row.save();
    res.status(201).json(row);
  } catch (error) {
    console.error("Error creating row:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
