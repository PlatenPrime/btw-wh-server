import { Request, Response } from "express";
import { updateDelTitleSchema } from "./schemas/updateDelTitleSchema.js";
import { updateDelTitleByIdUtil } from "./utils/updateDelTitleByIdUtil.js";

/**
 * @desc    Обновить название поставки
 * @route   PATCH /api/dels/:id/title
 */
export const updateDelTitleByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const parseResult = updateDelTitleSchema.safeParse({ id, title });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const del = await updateDelTitleByIdUtil({
      id: parseResult.data.id,
      title: parseResult.data.title,
    });
    if (!del) {
      res.status(404).json({ message: "Del not found" });
      return;
    }

    res.status(200).json({
      message: "Del title updated successfully",
      data: del,
    });
  } catch (error) {
    console.error("Error updating del title:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
