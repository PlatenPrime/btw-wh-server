import { Request, Response } from "express";
import mongoose from "mongoose";
import { IZone, Zone } from "../models/Zone.js";

export const getZoneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Проверка валидности ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid zone ID format",
      });
    }

    // Поиск зоны по ID
    const zone: IZone | null = await Zone.findById(id);

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
  } catch (error) {
    console.error("Error fetching zone by ID:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
