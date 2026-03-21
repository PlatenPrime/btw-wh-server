import { Request, Response } from "express";
import { deleteSkugrByIdSchema } from "./schemas/deleteSkugrByIdSchema.js";
import { deleteSkugrByIdUtil } from "./utils/deleteSkugrByIdUtil.js";

/**
 * @desc    Удалить группу товаров конкурента по id
 * @route   DELETE /api/skugrs/id/:id
 */
export const deleteSkugrByIdController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parseResult = deleteSkugrByIdSchema.safeParse({ id: req.params.id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const skugr = await deleteSkugrByIdUtil(parseResult.data.id);
    if (!skugr) {
      res.status(404).json({ message: "Skugr not found" });
      return;
    }

    res.status(200).json({
      message: "Skugr deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting skugr:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
