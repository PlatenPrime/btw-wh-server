import { Request, Response } from "express";
import { Seg } from "../../models/Seg.js";
import { logModuleError } from "../../../../logging/logModuleError.js";

export const getAllSegs = async (req: Request, res: Response) => {
  try {
    const segs = await Seg.find({}).sort({ order: 1 }).exec();

    res.status(200).json({
      exists: segs.length > 0,
      message: "Segments retrieved successfully",
      data: segs.map((seg) => seg.toObject()),
    });
  } catch (error: any) {
    logModuleError("segs", error, "getAllSegs error:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: error instanceof Error ? error.message : error,
      });
    }
  }
};

