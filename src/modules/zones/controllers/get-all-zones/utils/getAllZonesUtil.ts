import { GetAllZonesQuery } from "../../../schemas/zoneSchema.js";
import { IZone, Zone } from "../../../models/Zone.js";

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



