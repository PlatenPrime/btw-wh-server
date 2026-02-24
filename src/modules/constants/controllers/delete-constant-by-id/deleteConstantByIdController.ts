import { Request, Response } from "express";
import { deleteConstantByIdSchema } from "./schemas/deleteConstantByIdSchema.js";
import { deleteConstantByIdUtil } from "./utils/deleteConstantByIdUtil.js";

/**
 * @desc    Удалить константу по id
 * @route   DELETE /api/constants/id/:id
 * @access  PRIME
 */
export const deleteConstantByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = deleteConstantByIdSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const constant = await deleteConstantByIdUtil(parseResult.data.id);
    if (!constant) {
      res.status(404).json({ message: "Constant not found" });
      return;
    }

    res.status(200).json({
      message: "Constant deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting constant:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
