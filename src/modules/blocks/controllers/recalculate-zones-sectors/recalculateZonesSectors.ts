import { Request, Response } from "express";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { calculateZonesSectorsUtil } from "../../utils/calculateZonesSectorsUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";

export const recalculateZonesSectors = async (req: Request, res: Response) => {
  try {
    const result = await calculateZonesSectorsUtil();

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "blocks",
        type: "other",
        description: `Перераховано сектори зон: оновлено ${result.updatedZones} зон у ${result.blocksProcessed} блоках`,
      });
    }

    res.status(200).json({
      message: "Zones sectors recalculated successfully",
      data: {
        updatedZones: result.updatedZones,
        blocksProcessed: result.blocksProcessed,
      },
    });
  } catch (error) {
    logModuleError("blocks", error, "Error recalculating zones sectors:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

