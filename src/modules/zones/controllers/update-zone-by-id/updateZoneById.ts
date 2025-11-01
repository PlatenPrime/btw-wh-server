import { Request, Response } from "express";
import mongoose from "mongoose";
import { updateZoneSchema } from "./schemas/updateZoneByIdSchema.js";
import { checkZoneDuplicatesUpdateUtil } from "./utils/checkZoneDuplicatesUpdateUtil.js";
import { updateZoneByIdUtil } from "./utils/updateZoneByIdUtil.js";

export const updateZoneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Проверка валидности ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        message: "Invalid zone ID format",
      });
      return;
    }

    // Валидация входных данных
    const parseResult = updateZoneSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const updateData = parseResult.data;

    // Проверка существования зоны
    const existingZone = await updateZoneByIdUtil({ id, updateData: {} });
    if (!existingZone) {
      res.status(404).json({
        message: "Zone not found",
      });
      return;
    }

    // Проверка на дубликаты (исключая текущую зону)
    const duplicateZone = await checkZoneDuplicatesUpdateUtil({ id, updateData });

    if (duplicateZone) {
      const duplicateFields = [];
      if (updateData.title && duplicateZone.title === updateData.title) {
        duplicateFields.push("title");
      }
      if (
        updateData.bar !== undefined &&
        duplicateZone.bar === updateData.bar
      ) {
        duplicateFields.push("bar");
      }

      res.status(409).json({
        message: "Zone with this data already exists",
        duplicateFields,
      });
      return;
    }

    // Обновление зоны
    const updatedZone = await updateZoneByIdUtil({ id, updateData });

    if (!updatedZone) {
      res.status(404).json({
        message: "Zone not found",
      });
      return;
    }

    res.status(200).json({
      message: "Zone updated successfully",
      data: updatedZone,
    });
  } catch (error) {
    console.error("Error updating zone:", error);

    // Обработка ошибок MongoDB
    if (error instanceof Error && error.name === "MongoServerError") {
      const mongoError = error as any;
      if (mongoError.code === 11000) {
        const duplicateField = Object.keys(mongoError.keyPattern)[0];
        res.status(409).json({
          message: `Zone with this ${duplicateField} already exists`,
        });
        return;
      }
    }

    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

