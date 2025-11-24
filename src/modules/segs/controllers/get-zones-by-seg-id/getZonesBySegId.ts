import { Request, Response } from "express";
import { getZonesBySegIdSchema } from "./schemas/getZonesBySegIdSchema.js";
import { getZonesBySegIdUtil } from "./utils/getZonesBySegIdUtil.js";

export const getZonesBySegId = async (req: Request, res: Response) => {
  try {
    const { segId } = req.params;

    // Валидация входных данных
    const parseResult = getZonesBySegIdSchema.safeParse({ segId });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const zones = await getZonesBySegIdUtil(parseResult.data);

    res.status(200).json({
      exists: zones.length > 0,
      message: "Zones retrieved successfully",
      data: zones.map((zone) => zone.toObject()),
    });
  } catch (error: any) {
    console.error("getZonesBySegId error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: error instanceof Error ? error.message : error,
      });
    }
  }
};

