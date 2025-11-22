import { Request, Response } from "express";
import { calculateZonesSectorsUtil } from "../../utils/calculateZonesSectorsUtil.js";

export const recalculateZonesSectors = async (req: Request, res: Response) => {
  try {
    const result = await calculateZonesSectorsUtil();

    res.status(200).json({
      message: "Zones sectors recalculated successfully",
      data: {
        updatedZones: result.updatedZones,
        blocksProcessed: result.blocksProcessed,
      },
    });
  } catch (error) {
    console.error("Error recalculating zones sectors:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

