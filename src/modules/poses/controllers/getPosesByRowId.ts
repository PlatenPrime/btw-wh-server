import { Request, Response } from "express";
import mongoose from "mongoose";
import { IPos, Pos } from "../models/Pos.js";

export const getPosesByRowId = async (req: Request, res: Response) => {
  const { rowId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(rowId)) {
    res.status(400).json({ error: "Invalid row ID" });
    return;
  }

  try {
    const poses: IPos[] = await Pos.find({ "rowData._id": rowId }).sort({
      artikul: -1,
    });

    res.json(poses);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch poses by row", details: error });
  }
};
