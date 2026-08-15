import { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { getAllGraboSkusQuerySchema } from "./schemas/getAllGraboSkusQuerySchema.js";
import { getAllGraboSkusUtil } from "./utils/getAllGraboSkusUtil.js";

/**
 * @desc    Список GraboSku с пагинацией, фильтрами и опционально filterOptions
 * @route   GET /api/grabo-skus
 */
export const getAllGraboSkusController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parseResult = getAllGraboSkusQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid query parameters",
        errors: parseResult.error.errors,
      });
      return;
    }

    const result = await getAllGraboSkusUtil(parseResult.data);

    res.status(200).json({
      message: "Grabo skus retrieved successfully",
      data: result.graboSkus,
      pagination: result.pagination,
      ...(result.filterOptions !== undefined
        ? { filterOptions: result.filterOptions }
        : {}),
    });
  } catch (error) {
    logModuleError("grabo-skus", error, "Error fetching grabo skus:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
