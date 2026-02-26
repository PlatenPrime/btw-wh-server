import { Request, Response } from "express";
import { deleteAnalogByIdSchema } from "./schemas/deleteAnalogByIdSchema.js";
import { deleteAnalogByIdUtil } from "./utils/deleteAnalogByIdUtil.js";

/**
 * @desc    Удалить аналог по id
 * @route   DELETE /api/analogs/id/:id
 */
export const deleteAnalogByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = deleteAnalogByIdSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const analog = await deleteAnalogByIdUtil(parseResult.data.id);
    if (!analog) {
      res.status(404).json({ message: "Analog not found" });
      return;
    }

    res.status(200).json({ message: "Analog deleted successfully" });
  } catch (error) {
    console.error("Error deleting analog:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
