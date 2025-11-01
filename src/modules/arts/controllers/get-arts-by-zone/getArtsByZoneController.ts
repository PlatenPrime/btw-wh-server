import { Request, Response } from "express";
import { getArtsByZoneSchema } from "./schemas/getArtsByZoneSchema.js";
import { getArtsByZoneUtil } from "./utils/getArtsByZoneUtil.js";

export const getArtsByZoneController = async (
  req: Request,
  res: Response
) => {
  try {
    const { zone } = req.params;

    // Валидация входных данных
    const parseResult = getArtsByZoneSchema.safeParse({ zone });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid zone parameter",
        errors: parseResult.error.errors,
      });
      return;
    }

    const arts = await getArtsByZoneUtil(parseResult.data.zone);

    res.status(200).json({
      data: arts,
      total: arts.length,
    });
  } catch (error) {
    console.error("Error fetching arts by zone:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

