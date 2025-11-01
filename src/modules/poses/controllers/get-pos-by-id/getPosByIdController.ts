import { Request, Response } from "express";
import { getPosByIdUtil } from "./utils/getPosByIdUtil.js";

export const getPosByIdController = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // 1. Получаем позицию через утилиту
    const pos = await getPosByIdUtil(id);

    // 2. HTTP ответ (используем exists согласно документации)
    if (!pos) {
      res.status(200).json({
        exists: false,
        message: "Position not found",
        data: null,
      });
      return;
    }

    res.status(200).json({
      exists: true,
      message: "Position retrieved successfully",
      data: pos,
    });
  } catch (error) {
    // 2. Обработка ошибок
    if (!res.headersSent) {
      if (error instanceof Error && error.message === "Invalid position ID") {
        res.status(400).json({ error: "Invalid position ID" });
      } else {
        res.status(500).json({
          error: "Failed to fetch position",
          details: error,
        });
      }
    }
  }
};

