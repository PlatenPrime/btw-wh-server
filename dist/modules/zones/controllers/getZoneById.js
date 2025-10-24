import mongoose from "mongoose";
import { Zone } from "../models/Zone.js";
export const getZoneById = async (req, res) => {
    try {
        const { id } = req.params;
        // Проверка валидности ObjectId
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid zone ID format",
            });
        }
        // Поиск зоны по ID
        const zone = await Zone.findById(id);
        if (!zone) {
            return res.status(200).json({
                exists: false,
                message: "Zone not found",
                data: null,
            });
        }
        res.status(200).json({
            exists: true,
            message: "Zone retrieved successfully",
            data: zone,
        });
    }
    catch (error) {
        console.error("Error fetching zone by ID:", error);
        res.status(500).json({
            message: "Server error",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
};
