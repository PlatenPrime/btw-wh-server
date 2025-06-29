import { Request, Response } from "express";
import { Row } from "../models/Row.js";

export const updateRow = async (req: Request, res: Response) => {
  try {
    const row = await Row.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!row) return res.status(404).json({ message: "Row not found" });
    res.json(row);
  } catch (error) {
    console.error("Error updating row:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
