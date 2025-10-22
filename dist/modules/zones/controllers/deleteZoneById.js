import mongoose from "mongoose";
import { Zone } from "../models/Zone.js";
export const deleteZoneById = async (req, res) => {
    try {
        const { id } = req.params;
        // Проверка валидности ObjectId
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid zone ID format",
            });
        }
        // Поиск и удаление зоны
        const deletedZone = await Zone.findByIdAndDelete(id);
        if (!deletedZone) {
            return res.status(404).json({
                message: "Zone not found",
            });
        }
        res.status(200).json({
            message: "Zone deleted successfully",
            data: deletedZone,
        });
    }
    catch (error) {
        console.error("Error deleting zone:", error);
        res.status(500).json({
            message: "Server error",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
};
