import { Request, Response } from "express";
import mongoose from "mongoose";
import { getZoneByIdSchema } from "./schemas/getZoneByIdSchema.js";
import { getZoneByIdUtil } from "./utils/getZoneByIdUtil.js";

export const getZoneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Валидация входных данных
    const parseResult = getZoneByIdSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid zone ID format",
        errors: parseResult.error.errors,
      });
      return;
    }

    const zone = await getZoneByIdUtil(parseResult.data.id);

    if (!zone) {
      res.status(200).json({
        exists: false,
        message: "Zone not found",
        data: null,
      });
      return;
    }

    res.status(200).json({
      exists: true,
      message: "Zone retrieved successfully",
      data: zone,
    });
  } catch (error) {
    console.error("Error fetching zone by ID:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};


