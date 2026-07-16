import { Request, Response } from "express";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { Zone } from "../../../zones/models/Zone.js";
import { logModuleError } from "../../../../logging/logModuleError.js";

export const resetZonesSectors = async (req: Request, res: Response) => {
  try {
    // Установить sector = 0 у всех зон через bulkWrite
    const result = await Zone.updateMany({}, { $set: { sector: 0 } });

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "blocks",
        description: `Скинуто сектори усіх зон: оновлено ${result.modifiedCount} з ${result.matchedCount}`,
      });
    }

    res.status(200).json({
      message: "Zones sectors reset successfully",
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    logModuleError("blocks", error, "Error resetting zones sectors:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

