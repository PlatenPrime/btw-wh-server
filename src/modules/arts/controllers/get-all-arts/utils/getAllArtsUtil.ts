import { GetAllArtsQuery } from "../schemas/getAllArtsSchema.js";
import { IArt, Art } from "../../../models/Art.js";

type GetAllArtsUtilInput = GetAllArtsQuery;

type GetAllArtsResult = {
  arts: IArt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getAllArtsUtil = async ({
  page,
  limit,
  search,
}: GetAllArtsUtilInput): Promise<GetAllArtsResult> => {
  // Построение поискового запроса
  const searchQuery = search
    ? {
        $or: [
          { artikul: { $regex: search, $options: "i" } },
          { nameukr: { $regex: search, $options: "i" } },
          { namerus: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  // Выполнение запроса с пагинацией
  const arts: IArt[] = await Art.find(searchQuery)
    .sort({ artikul: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Подсчет общего количества записей
  const total = await Art.countDocuments(searchQuery);

  const totalPages = Math.ceil(total / limit);

  return {
    arts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

