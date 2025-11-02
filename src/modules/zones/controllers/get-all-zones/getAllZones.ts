import { Request, Response } from "express";
import { getAllZonesQuerySchema } from "../../schemas/zoneSchema.js";
import { getAllZonesUtil } from "./utils/getAllZonesUtil.js";

interface GetAllZonesRequest extends Request<{}, {}, {}, any> {}

export const getAllZones = async (req: GetAllZonesRequest, res: Response) => {
  try {
    // Валидация параметров запроса
    const parseResult = getAllZonesQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid query parameters",
        errors: parseResult.error.errors,
      });
      return;
    }

    const { page, limit, search, sortBy, sortOrder } = parseResult.data;

    const result = await getAllZonesUtil({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      message: "Zones retrieved successfully",
      data: result.zones,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching zones:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};








