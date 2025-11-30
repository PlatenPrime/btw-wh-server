import { Request, Response } from "express";
import { processPosesByArtikulUtil } from "./utils/processPosesByArtikulUtil.js";

export const getPosesByArtikulController = async (
  req: Request,
  res: Response
) => {
  try {
    const { artikul } = req.params;

    // 1. Валидация
    if (!artikul) {
      res.status(400).json({
        success: false,
        message: "Artikul parameter is required",
      });
      return;
    }

    // 2. Обрабатываем позиции
    const response = await processPosesByArtikulUtil(artikul);

    // 3. HTTP ответ
    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    // 4. Обработка ошибок
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
