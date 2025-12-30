import { IZone, Zone } from "../../../models/Zone.js";
import { GetAllZonesQuery } from "../../../schemas/zoneSchema.js";
import { sortZonesByTitle } from "./sortZonesByTitle.js";

type GetAllZonesUtilInput = GetAllZonesQuery;

type GetAllZonesResult = {
  zones: IZone[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export const getAllZonesUtil = async ({
  page,
  limit,
  search,
  sortBy,
  sortOrder,
}: GetAllZonesUtilInput): Promise<GetAllZonesResult> => {
  // Построение поискового запроса
  const searchQuery = search
    ? {
        $or: [
          { title: { $regex: search, $options: "i" } },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$bar" },
                regex: search,
                options: "i",
              },
            },
          },
        ],
      }
    : {};

  // Если сортировка по title, используем сортировку в памяти
  if (sortBy === "title") {
    // Получаем все зоны, соответствующие поисковому запросу
    const allZones: IZone[] = await Zone.find(searchQuery);

    // Сортируем в памяти с числовым сравнением сегментов
    const sortedZones = sortZonesByTitle(allZones, sortOrder);

    // Подсчет общего количества записей
    const total = sortedZones.length;

    // Применяем пагинацию после сортировки
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const zones = sortedZones.slice(startIndex, endIndex);

    const totalPages = Math.ceil(total / limit);

    return {
      zones,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // Для остальных полей используем стандартную сортировку
  const sortOptions: Record<string, 1 | -1> = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Выполнение запроса с пагинацией
  const zones: IZone[] = await Zone.find(searchQuery)
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(limit);

  // Подсчет общего количества записей
  const total = await Zone.countDocuments(searchQuery);

  const totalPages = Math.ceil(total / limit);

  return {
    zones,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};
