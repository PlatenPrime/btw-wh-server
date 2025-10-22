import mongoose from "mongoose";
import { Zone } from "../models/Zone.js";
import { updateZoneSchema } from "../schemas/zoneSchema.js";
export const updateZoneById = async (req, res) => {
    try {
        const { id } = req.params;
        // Проверка валидности ObjectId
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid zone ID format",
            });
        }
        // Валидация входных данных
        const parseResult = updateZoneSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
        }
        const updateData = parseResult.data;
        // Проверка существования зоны
        const existingZone = await Zone.findById(id);
        if (!existingZone) {
            return res.status(404).json({
                message: "Zone not found",
            });
        }
        // Проверка на дубликаты (исключая текущую зону)
        const duplicateQuery = {
            _id: { $ne: id },
        };
        if (updateData.title) {
            duplicateQuery.title = updateData.title;
        }
        if (updateData.bar !== undefined) {
            duplicateQuery.bar = updateData.bar;
        }
        const duplicateZone = await Zone.findOne(duplicateQuery);
        if (duplicateZone) {
            const duplicateFields = [];
            if (updateData.title && duplicateZone.title === updateData.title) {
                duplicateFields.push("title");
            }
            if (updateData.bar !== undefined &&
                duplicateZone.bar === updateData.bar) {
                duplicateFields.push("bar");
            }
            return res.status(409).json({
                message: "Zone with this data already exists",
                duplicateFields,
            });
        }
        // Обновление зоны
        const updatedZone = await Zone.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updatedZone) {
            return res.status(404).json({
                message: "Zone not found",
            });
        }
        res.status(200).json({
            message: "Zone updated successfully",
            data: updatedZone,
        });
    }
    catch (error) {
        console.error("Error updating zone:", error);
        // Обработка ошибок MongoDB
        if (error instanceof Error && error.name === "MongoServerError") {
            const mongoError = error;
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
