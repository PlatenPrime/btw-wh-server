import { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { purgePromotedFromNewskuUtil } from "./utils/purgePromotedFromNewskuUtil.js";

/**
 * @desc    Убрать из всех групп newsku ссылки на SKU с уже назначенным реальным prodName
 * @route   POST /api/skugrs/purge-promoted-from-newsku
 */
export const purgePromotedFromNewskuController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await purgePromotedFromNewskuUtil();

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "skugrs",
        type: "edit",
        description: `Очищено промоутнуті sku з груп newsku: груп ${result.groupsTotal}, змінено ${result.groupsModified}, унікальних sku ${result.uniqueSkusRemoved}, посилань ${result.linksRemoved}`,
      });
    }

    res.status(200).json({
      message: "Promoted skus purged from newsku groups successfully",
      data: result,
    });
  } catch (error) {
    logModuleError(
      "skugrs",
      error,
      "Error purging promoted skus from newsku groups:",
    );
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
