import { IZone, Zone } from "../../../models/Zone.js";
import { GetAllZonesQuery } from "../../../schemas/zoneSchema.js";

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

  // Если сортировка по title, используем aggregation pipeline для числовой сортировки
  if (sortBy === "title") {
    const sortDirection = sortOrder === "desc" ? -1 : 1;

    const aggregationResult = await Zone.aggregate([
      // Поиск
      { $match: searchQuery },
      // Преобразуем title в массив чисел для правильной сортировки
      // Дополняем массивы нулями до 3 элементов для корректного сравнения
      {
        $addFields: {
          titleParts: {
            $let: {
              vars: {
                parts: {
                  $map: {
                    input: { $split: ["$title", "-"] },
                    as: "part",
                    in: { $toInt: "$$part" },
                  },
                },
              },
              in: {
                $concatArrays: [
                  "$$parts",
                  {
                    $cond: {
                      if: { $eq: [{ $size: "$$parts" }, 3] },
                      then: [],
                      else: {
                        $cond: {
                          if: { $eq: [{ $size: "$$parts" }, 2] },
                          then: [0],
                          else: [0, 0],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      // Сортируем по массиву чисел
      { $sort: { titleParts: sortDirection } },
      // Используем facet для получения данных и подсчета total одновременно
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            // Удаляем временное поле titleParts из результата
            { $unset: "titleParts" },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const zones = aggregationResult[0]?.data || [];
    const total = aggregationResult[0]?.total[0]?.count || 0;

    const totalPages = Math.ceil(total / limit);

    return {
      zones: zones as IZone[],
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
