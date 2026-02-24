import { Request, Response } from "express";
import { getConstantByIdSchema } from "./schemas/getConstantByIdSchema.js";
import { getConstantByIdUtil } from "./utils/getConstantByIdUtil.js";

/**
 * @desc    Получить константу по id
 * @route   GET /api/constants/id/:id
 */
export const getConstantByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = getConstantByIdSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const constant = await getConstantByIdUtil(parseResult.data.id);
    if (!constant) {
      res.status(404).json({ message: "Constant not found" });
      return;
    }

    res.status(200).json({
      message: "Constant retrieved successfully",
      data: constant,
    });
  } catch (error) {
    console.error("Error fetching constant by id:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
