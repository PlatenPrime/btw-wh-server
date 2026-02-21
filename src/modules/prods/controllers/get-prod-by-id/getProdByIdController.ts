import { Request, Response } from "express";
import { getProdByIdSchema } from "./schemas/getProdByIdSchema.js";
import { getProdByIdUtil } from "./utils/getProdByIdUtil.js";

/**
 * @desc    Получить производителя по id
 * @route   GET /api/prods/id/:id
 */
export const getProdByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = getProdByIdSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const prod = await getProdByIdUtil(parseResult.data.id);
    if (!prod) {
      res.status(404).json({ message: "Prod not found" });
      return;
    }

    res.status(200).json({
      message: "Prod retrieved successfully",
      data: prod,
    });
  } catch (error) {
    console.error("Error fetching prod by id:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
