import { Request, Response } from "express";
import { updateAnalogByIdSchema } from "./schemas/updateAnalogByIdSchema.js";
import { updateAnalogByIdUtil } from "./utils/updateAnalogByIdUtil.js";

/**
 * @desc    Обновить аналог по id
 * @route   PATCH /api/analogs/id/:id
 */
export const updateAnalogByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;
    const parseResult = updateAnalogByIdSchema.safeParse({
      id,
      ...body,
    });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const analog = await updateAnalogByIdUtil(parseResult.data);
    if (!analog) {
      res.status(404).json({ message: "Analog not found" });
      return;
    }

    res.status(200).json({
      message: "Analog updated successfully",
      data: analog,
    });
  } catch (error) {
    console.error("Error updating analog:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
