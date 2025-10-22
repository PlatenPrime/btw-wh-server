import { Request, Response } from "express";
import { IZone, Zone } from "../models/Zone.js";
import {
  GetAllZonesQuery,
  getAllZonesQuerySchema,
} from "../schemas/zoneSchema.js";

interface GetAllZonesRequest extends Request<{}, {}, {}, GetAllZonesQuery> {}

export const getAllZones = async (req: GetAllZonesRequest, res: Response) => {
  try {
    // Валидация параметров запроса
    const parseResult = getAllZonesQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: parseResult.error.errors,
      });
    }

    const { page, limit, search, sortBy, sortOrder } = parseResult.data;

    // Построение поискового запроса
    // Поиск только по строковому полю title, т.к. bar и sector - числовые
    const searchQuery = search
      ? {
          title: { $regex: search, $options: "i" },
        }
      : {};

    // Настройка сортировки
    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Выполнение запроса с пагинацией
    const zones: IZone[] = await Zone.find(searchQuery)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    // Подсчет общего количества записей
    const total = await Zone.countDocuments(searchQuery);

    res.status(200).json({
      message: "Zones retrieved successfully",
      data: zones,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching zones:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
