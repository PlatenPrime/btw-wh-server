import { NextFunction, Request, Response } from "express";
import { Zone } from "../models/Zone.js";
import { bulkCreateZonesSchema } from "../schemas/zoneSchema.js";

export const upsertZones = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

  const operations = zones.map((zone) => ({
    updateOne: {
      filter: { bar: zone.bar },
      update: {
        $set: {
          title: zone.title,
          bar: zone.bar,
          sector: zone.sector !== undefined ? zone.sector : 0,
        },
      },
      upsert: true,
    },
  }));

  try {
    const result = await Zone.bulkWrite(operations);
    res.status(200).json({ message: "Upsert completed", result });
  } catch (error) {
    console.error("Upsert error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
