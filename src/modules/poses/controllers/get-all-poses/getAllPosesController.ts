import { Request, Response } from "express";
import { getAllPosesUtil } from "./utils/getAllPosesUtil.js";

export const getAllPosesController = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "20",
      rowId,
      palletId,
      rowTitle,
      palletTitle,
      artikul,
      nameukr,
      sklad,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // 1. Получаем позиции через утилиту
    const result = await getAllPosesUtil({
      filter: {
        rowId: rowId as string | undefined,
        palletId: palletId as string | undefined,
        rowTitle: rowTitle as string | undefined,
        palletTitle: palletTitle as string | undefined,
        artikul: artikul as string | undefined,
        nameukr: nameukr as string | undefined,
        sklad: sklad as string | undefined,
      },
      page: pageNum,
      limit: limitNum,
    });

    // 2. HTTP ответ
    res.status(200).json(result);
  } catch (error) {
    // 3. Обработка ошибок
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to fetch poses", details: error });
    }
  }
};

