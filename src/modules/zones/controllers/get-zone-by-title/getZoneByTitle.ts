import { Request, Response } from "express";
import { getZoneByTitleSchema } from "./schemas/getZoneByTitleSchema.js";
import { getZoneByTitleUtil } from "./utils/getZoneByTitleUtil.js";

export const getZoneByTitle = async (req: Request, res: Response) => {
  try {
    const { title } = req.params;

    // Валидация входных данных
    const parseResult = getZoneByTitleSchema.safeParse({ title });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Title is required",
        errors: parseResult.error.errors,
      });
      return;
    }

    const zone = await getZoneByTitleUtil(parseResult.data.title);

    if (!zone) {
      res.status(404).json({
        message: "Zone not found",
      });
      return;
    }

    res.status(200).json({
      exists: true,
      message: "Zone retrieved successfully",
      data: zone,
    });
  } catch (error) {
    console.error("Error fetching zone by title:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};
