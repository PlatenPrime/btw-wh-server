import { Request, Response } from "express";
import mongoose from "mongoose";
import { Seg } from "../../models/Seg.js";
import { getSegsByBlockIdSchema } from "./schemas/getSegsByBlockIdSchema.js";

export const getSegsByBlockId = async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params;

    // Валидация входных данных
    const parseResult = getSegsByBlockIdSchema.safeParse({ blockId });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const objectId = new mongoose.Types.ObjectId(parseResult.data.blockId);
    const segs = await Seg.find({ block: objectId })
      .sort({ order: 1 })
      .exec();

    res.status(200).json({
      exists: segs.length > 0,
      message: "Segments retrieved successfully",
      data: segs.map((seg) => seg.toObject()),
    });
  } catch (error: any) {
    console.error("getSegsByBlockId error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: error instanceof Error ? error.message : error,
      });
    }
  }
};

