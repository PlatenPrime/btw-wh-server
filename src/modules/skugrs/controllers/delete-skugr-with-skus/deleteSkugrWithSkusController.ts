import { Request, Response } from "express";
import { deleteSkugrWithSkusSchema } from "./schemas/deleteSkugrWithSkusSchema.js";
import { deleteSkugrWithSkusUtil } from "./utils/deleteSkugrWithSkusUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";

/**
 * @desc    Удалить товарную группу и документы Sku из её skus; id убрать из других групп
 * @route   DELETE /api/skugrs/id/:id/with-skus
 */
export const deleteSkugrWithSkusController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parseResult = deleteSkugrWithSkusSchema.safeParse({
      id: req.params.id,
    });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const result = await deleteSkugrWithSkusUtil(parseResult.data.id);
    if (!result) {
      res.status(404).json({ message: "Skugr not found" });
      return;
    }

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "skugrs",
        type: "delete",
        description: `Видалено товарну групу (id: ${parseResult.data.id}) разом з sku: ${result.deletedSkusCount} шт. (оновлено інших груп: ${result.modifiedSkugrsCount})`,
      });
    }

    res.status(200).json({
      message: "Skugr and linked skus deleted successfully",
      data: {
        deletedSkusCount: result.deletedSkusCount,
        modifiedSkugrsCount: result.modifiedSkugrsCount,
      },
    });
  } catch (error) {
    logModuleError("skugrs", error, "Error deleting skugr with skus:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
