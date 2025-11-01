import { Request, Response } from "express";
import { enrichDefsWithAsksUtil } from "./utils/enrichDefsWithAsksUtil.js";
import { getLatestDefUtil } from "./utils/getLatestDefUtil.js";
import { getLatestDefsSchema } from "./schemas/getLatestDefsSchema.js";

/**
 * @desc    Получить последнюю актуальную запись о дефицитах с информацией о существующих заявках
 * @route   GET /api/defs/latest
 * @access  Private
 */
export const getLatestDefsController = async (
  req: Request,
  res: Response
) => {
  try {
    // Валидация входных данных
    const parseResult = getLatestDefsSchema.safeParse({});
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const latestDef = await getLatestDefUtil();

    if (!latestDef) {
      res.status(200).json({
        exists: false,
        message: "No deficit calculations found",
        data: null,
      });
      return;
    }

    // Обогащаем дефициты информацией о заявках
    const resultWithAsks = await enrichDefsWithAsksUtil(latestDef);

    // Формируем итоговый ответ
    const responseData = {
      ...latestDef,
      result: resultWithAsks,
    };

    res.status(200).json({
      exists: true,
      message: "Latest deficit calculation retrieved successfully",
      data: responseData,
    });
    return;
  } catch (error) {
    console.error("Error in getLatestDefsController:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to get latest deficit calculation",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};

