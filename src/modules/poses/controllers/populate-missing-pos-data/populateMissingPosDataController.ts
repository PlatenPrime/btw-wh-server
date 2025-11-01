import { Request, Response } from "express";
import { populateMissingPosDataUtil } from "./utils/populateMissingPosDataUtil.js";

export const populateMissingPosDataController = async (
  _req: Request,
  res: Response
) => {
  try {
    // 1. Выполняем заполнение данных
    const result = await populateMissingPosDataUtil();

    // 2. HTTP ответ
    res.status(200).json({
      updated: result.updated,
      errors: result.errors,
      errorDetails: result.errorDetails,
    });
  } catch (error) {
    // 3. Обработка ошибок
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

