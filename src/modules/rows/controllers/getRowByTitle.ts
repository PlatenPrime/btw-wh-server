import { Request, Response } from "express";
import { Row } from "../models/Row.js";

export const getRowByTitle = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { title } = req.params;

  try {
    const row = await Row.findOne({ title: title });

    if (!row) {
      res.status(404).json({ message: "Row not found" });
      return;
    }

    res.status(200).json(row);
  } catch (error) {
    console.log("Error fetching row:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
