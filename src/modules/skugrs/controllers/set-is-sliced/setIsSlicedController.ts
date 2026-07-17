import { Request, Response } from "express";
import { setIsSlicedUtil } from "./utils/setIsSlicedUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";

/**
 * @desc    Единоразово проставить isSliced=true для старых skugr без поля isSliced
 * @route   POST /api/skugrs/set-is-sliced
 */
export const setIsSlicedController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await setIsSlicedUtil();

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "skugrs",
        type: "edit",
        description: `Масово встановлено isSliced для товарних груп: знайдено ${result.matchedCount}, змінено ${result.modifiedCount} шт.`,
      });
    }

    res.status(200).json({
      message: "Skugr isSliced field set successfully",
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    logModuleError("skugrs", error, "Error setting isSliced for skugrs:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
