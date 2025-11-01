import { Request, Response } from "express";
import { bulkCreateZonesSchema } from "./schemas/bulkCreateZonesSchema.js";
import { bulkCreateZonesUtil } from "./utils/bulkCreateZonesUtil.js";

export const upsertZones = async (req: Request, res: Response) => {
  try {
    // Валидация входных данных
    const parseResult = bulkCreateZonesSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const { zones } = parseResult.data;

    if (!Array.isArray(zones) || zones.length === 0) {
      res.status(400).json({ message: "Invalid or empty data" });
      return;
    }

    const result = await bulkCreateZonesUtil({ zones });

    res.status(200).json({ message: "Upsert completed", result });
  } catch (error) {
    console.error("Upsert error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error });
    }
  }
};

