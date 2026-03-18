import { Request, Response } from "express";
import { deleteVariantByIdSchema } from "./schemas/deleteVariantByIdSchema.js";
import { deleteVariantByIdUtil } from "./utils/deleteVariantByIdUtil.js";

/**
 * @desc    Удалить вариант по id
 * @route   DELETE /api/variants/id/:id
 */
export const deleteVariantByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const parseResult = deleteVariantByIdSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const variant = await deleteVariantByIdUtil(parseResult.data.id);
    if (!variant) {
      res.status(404).json({ message: "Variant not found" });
      return;
    }

    res.status(200).json({ message: "Variant deleted successfully" });
  } catch (error) {
    console.error("Error deleting variant:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

