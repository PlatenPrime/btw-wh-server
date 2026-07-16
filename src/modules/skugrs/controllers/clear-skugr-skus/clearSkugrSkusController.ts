import { Request, Response } from "express";
import { toSkugrDto } from "../../utils/toSkugrDto.js";
import { clearSkugrSkusSchema } from "./schemas/clearSkugrSkusSchema.js";
import { clearSkugrSkusUtil } from "./utils/clearSkugrSkusUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";

/**
 * @desc    Очистить массив skus у товарной группы (документы Sku не удаляются)
 * @route   POST /api/skugrs/id/:id/clear-skus
 */
export const clearSkugrSkusController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parseResult = clearSkugrSkusSchema.safeParse({ id: req.params.id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const skugr = await clearSkugrSkusUtil(parseResult.data.id);
    if (!skugr) {
      res.status(404).json({ message: "Skugr not found" });
      return;
    }

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "skugrs",
        description: `Очищено склад sku товарної групи "${skugr.title}" (id: ${skugr._id})`,
      });
    }

    res.status(200).json({
      message: "Skugr skus cleared successfully",
      data: toSkugrDto(skugr),
    });
  } catch (error) {
    logModuleError("skugrs", error, "Error clearing skugr skus:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
