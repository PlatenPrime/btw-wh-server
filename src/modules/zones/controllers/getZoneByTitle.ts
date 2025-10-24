import { Request, Response } from "express";
import { IZone, Zone } from "../models/Zone.js";

export const getZoneByTitle = async (req: Request, res: Response) => {
  try {
    const { title } = req.params;

    // Проверка наличия title
    if (!title || title.trim() === "") {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    // Поиск зоны по title
    const zone: IZone | null = await Zone.findOne({ title: title.trim() });

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
    console.error("Error fetching zone by title:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
