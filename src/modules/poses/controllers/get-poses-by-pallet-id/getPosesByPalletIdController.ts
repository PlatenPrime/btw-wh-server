import { Request, Response } from "express";
import { getPosesByPalletIdQuerySchema } from "./schemas/getPosesByPalletIdSchema.js";
import { getPosesByPalletIdUtil } from "./utils/getPosesByPalletIdUtil.js";

export const getPosesByPalletIdController = async (
  req: Request,
  res: Response
) => {
  const { palletId } = req.params;

  try {
    // 1. Валидация query параметров
    const parseResult = getPosesByPalletIdQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: "Invalid query parameters",
        details: parseResult.error.errors,
      });
      return;
    }

    const { sortBy, sortOrder } = parseResult.data;

    // 2. Получаем позиции через утилиту
    const poses = await getPosesByPalletIdUtil(palletId, sortBy, sortOrder);

    // 3. HTTP ответ
    res.status(200).json(poses);
  } catch (error) {
    // 4. Обработка ошибок
    if (!res.headersSent) {
      if (error instanceof Error && error.message === "Invalid pallet ID") {
        res.status(400).json({ error: "Invalid pallet ID" });
      } else {
        res.status(500).json({
          error: "Failed to fetch poses by pallet",
          details: error,
        });
      }
    }
  }
};
