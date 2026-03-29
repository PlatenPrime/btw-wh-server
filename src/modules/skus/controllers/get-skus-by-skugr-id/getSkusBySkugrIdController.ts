import { Request, Response } from "express";
import { getAllSkusQuerySchema } from "../get-all-skus/schemas/getAllSkusQuerySchema.js";
import { getSkusBySkugrIdParamsSchema } from "./schemas/getSkusBySkugrIdParamsSchema.js";
import { getSkusBySkugrIdUtil } from "./utils/getSkusBySkugrIdUtil.js";

/**
 * @desc    Получить SKU группы по id skugr с пагинацией и фильтрами
 * @route   GET /api/skus/by-skugr/:skugrId
 */
export const getSkusBySkugrIdController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const paramsResult = getSkusBySkugrIdParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      res.status(400).json({
        message: "Invalid path parameters",
        errors: paramsResult.error.errors,
      });
      return;
    }

    const queryResult = getAllSkusQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      res.status(400).json({
        message: "Invalid query parameters",
        errors: queryResult.error.errors,
      });
      return;
    }

    const result = await getSkusBySkugrIdUtil(
      paramsResult.data.skugrId,
      queryResult.data,
    );

    if (!result) {
      res.status(404).json({ message: "Skugr not found" });
      return;
    }

    res.status(200).json({
      message: "Skus retrieved successfully",
      data: result.skus,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching skus by skugr id:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
