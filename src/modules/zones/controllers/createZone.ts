import { Request, Response } from "express";
import { IZone, Zone } from "../models/Zone.js";
import { CreateZoneInput, createZoneSchema } from "../schemas/zoneSchema.js";

export const createZone = async (req: Request, res: Response) => {
  try {
    // Валидация входных данных
    const parseResult = createZoneSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
    }

    const zoneData: CreateZoneInput = parseResult.data;

    // Проверка на существование зоны с таким же title или bar
    const existingZone = await Zone.findOne({
      $or: [{ title: zoneData.title }, { bar: zoneData.bar }],
    });

    if (existingZone) {
      const duplicateFields = [];
      if (existingZone.title === zoneData.title) duplicateFields.push("title");
      if (existingZone.bar === zoneData.bar) duplicateFields.push("bar");

      return res.status(409).json({
        message: "Zone with this data already exists",
        duplicateFields,
      });
    }

    // Создание новой зоны
    const zone: IZone = new Zone(zoneData);
    await zone.save();

    res.status(201).json({
      message: "Zone created successfully",
      data: zone,
    });
  } catch (error) {
    console.error("Error creating zone:", error);

    // Обработка ошибок MongoDB
    if (error instanceof Error && error.name === "MongoServerError") {
      const mongoError = error as any;
      if (mongoError.code === 11000) {
        const duplicateField = Object.keys(mongoError.keyPattern)[0];
        return res.status(409).json({
          message: `Zone with this ${duplicateField} already exists`,
        });
      }
    }

    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
