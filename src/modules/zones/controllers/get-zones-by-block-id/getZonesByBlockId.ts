import { Request, Response } from "express";
import { getZonesByBlockIdSchema } from "./schemas/getZonesByBlockIdSchema.js";
import { getZonesByBlockIdUtil } from "./utils/getZonesByBlockIdUtil.js";

export const getZonesByBlockId = async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params;

    // Валидация входных данных
    const parseResult = getZonesByBlockIdSchema.safeParse({ blockId });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid block ID format",
        errors: parseResult.error.errors,
      });
      return;
    }

    const zones = await getZonesByBlockIdUtil({ blockId: parseResult.data.blockId });

    res.status(200).json({
      message: "Zones retrieved successfully",
      data: zones,
    });
  } catch (error) {
    console.error("Error fetching zones by block ID:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

