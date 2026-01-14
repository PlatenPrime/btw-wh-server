import { Request, Response } from "express";
import { getAsksByArtikulSchema } from "./schemas/getAsksByArtikulSchema.js";
import { getAsksByArtikulUtil } from "./utils/getAsksByArtikulUtil.js";
import { getAsksStatisticsUtil } from "../get-asks-by-date/utils/getAsksStatisticsUtil.js";

export const getAsksByArt = async (req: Request, res: Response) => {
  try {
    const { artikul } = req.query;

    // Валидация query параметров
    const parseResult = getAsksByArtikulSchema.safeParse({ artikul });
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
    }

    const asks = await getAsksByArtikulUtil(parseResult.data.artikul);

    const statistics = getAsksStatisticsUtil(asks);

    res.status(200).json({
      message: `Found ${asks.length} asks for artikul ${artikul}`,
      data: asks,
      artikul: artikul,
      count: asks.length,
      ...statistics,
    });
  } catch (error) {
    console.error("Error fetching asks by artikul:", error);
    res.status(500).json({
      message: "Server error while fetching asks by artikul",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
