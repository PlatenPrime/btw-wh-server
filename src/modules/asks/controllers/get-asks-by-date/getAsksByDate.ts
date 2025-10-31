import { Request, Response } from "express";
import { getAsksByDateSchema } from "./schemas/getAsksByDateSchema.js";
import { getAsksByDateUtil } from "./utils/getAsksByDateUtil.js";
import { getAsksStatisticsUtil } from "./utils/getAsksStatisticsUtil.js";

export const getAsksByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    // Валидация query параметров
    const parseResult = getAsksByDateSchema.safeParse({ date });
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
    }

    const asks = await getAsksByDateUtil(parseResult.data.date);

    const statistics = getAsksStatisticsUtil(asks);

    res.status(200).json({
      message: `Found ${asks.length} asks for ${date}`,
      data: asks,
      date: date,
      count: asks.length,
      ...statistics,
    });
  } catch (error) {
    console.error("Error fetching asks by date:", error);
    res.status(500).json({
      message: "Server error while fetching asks by date",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

