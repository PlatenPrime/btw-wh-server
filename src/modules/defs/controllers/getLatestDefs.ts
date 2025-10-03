import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Ask } from "../../asks/models/Ask.js";
import {
  Def,
  IDeficitCalculationResultWithAsks,
  IExistingAsk,
} from "../models/Def.js";

/**
 * @desc    Получить последнюю актуальную запись о дефицитах с информацией о существующих заявках
 * @route   GET /api/defs/latest
 * @access  Private
 */
export const getLatestDefs = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const latestDef = await Def.findOne().sort({ createdAt: -1 }).lean();

      if (!latestDef) {
        return res.status(404).json({
          success: false,
          message: "No deficit calculations found",
        });
      }

      // Получаем все активные заявки для артикулов из дефицитов
      const artikuls = Object.keys(latestDef.result);
      const existingAsks = await Ask.find({
        artikul: { $in: artikuls },
        status: { $in: ["new"] }, // только необработанные заявки
      })
        .select("artikul status createdAt askerData.fullname askerData._id")
        .lean();

      // Группируем заявки по артикулу (берем только первую активную заявку)
      const asksByArtikul = existingAsks.reduce((acc, ask) => {
        if (!acc[ask.artikul]) {
          acc[ask.artikul] = {
            _id: ask._id.toString(),
            status: ask.status,
            createdAt: ask.createdAt,
            askerName: ask.askerData.fullname,
            askerId: ask.askerData._id.toString(),
          } as IExistingAsk;
        }
        return acc;
      }, {} as Record<string, IExistingAsk>);

      // Добавляем информацию о заявках к каждому дефициту
      const resultWithAsks: IDeficitCalculationResultWithAsks = Object.keys(
        latestDef.result
      ).reduce((acc, artikul) => {
        acc[artikul] = {
          ...latestDef.result[artikul],
          existingAsk: asksByArtikul[artikul] || null,
        };
        return acc;
      }, {} as IDeficitCalculationResultWithAsks);

      // Формируем итоговый ответ
      const responseData = {
        ...latestDef,
        result: resultWithAsks,
      };

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get latest deficit calculation",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);
