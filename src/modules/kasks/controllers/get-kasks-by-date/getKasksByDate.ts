import { Request, Response } from "express";
import { getKasksByDateSchema } from "./schemas/getKasksByDateSchema.js";
import { getKasksByDateUtil } from "./utils/getKasksByDateUtil.js";

export const getKasksByDate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date } = req.query;
    const parseResult = getKasksByDateSchema.safeParse({ date });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const kasks = await getKasksByDateUtil(parseResult.data.date);
    res.status(200).json({
      message: "Kasks retrieved successfully",
      data: kasks,
      count: kasks.length,
    });
  } catch (error) {
    console.error("Error fetching kasks by date:", error);
    res.status(500).json({
      message: "Server error while fetching kasks by date",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
