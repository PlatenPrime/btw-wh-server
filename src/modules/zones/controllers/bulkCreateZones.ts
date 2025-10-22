import { Request, Response } from "express";
import { Zone } from "../models/Zone.js";
import { bulkCreateZonesSchema } from "../schemas/zoneSchema.js";

export const bulkCreateZones = async (req: Request, res: Response) => {
  try {
    // Валидация входных данных
    const parseResult = bulkCreateZonesSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
    }

    const { zones } = parseResult.data;

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; error: string; data: any }>,
    };

    // Обрабатываем каждую зону
    for (let i = 0; i < zones.length; i++) {
      const zoneData = zones[i];

      try {
        // Проверяем существование зоны с такими же данными
        const existingZone = await Zone.findOne({
          $or: [{ title: zoneData.title }, { bar: zoneData.bar }],
        });

        if (existingZone) {
          results.skipped++;
          results.errors.push({
            index: i,
            error: `Zone with title "${zoneData.title}" or bar "${zoneData.bar}" already exists`,
            data: zoneData,
          });
          continue;
        }

        // Создаем зону с sector = 0 (будет пересчитан отдельным сервисом)
        const zone = new Zone({
          title: zoneData.title,
          bar: zoneData.bar,
          sector: 0,
        });

        await zone.save();
        results.created++;
      } catch (error) {
        results.skipped++;
        results.errors.push({
          index: i,
          error: error instanceof Error ? error.message : "Unknown error",
          data: zoneData,
        });
      }
    }

    res.status(200).json({
      message: "Bulk create completed",
      results,
    });
  } catch (error) {
    console.error("Error in bulk create zones:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
