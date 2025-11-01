import { IPos, Pos } from "../../../models/Pos.js";

type GetAllPosesFilter = {
  rowId?: string;
  palletId?: string;
  rowTitle?: string;
  palletTitle?: string;
  artikul?: string;
  nameukr?: string;
  sklad?: string;
};

type GetAllPosesInput = {
  filter: GetAllPosesFilter;
  page: number;
  limit: number;
};

type GetAllPosesResult = {
  data: IPos[];
  total: number;
  page: number;
  totalPages: number;
};

/**
 * Получает все позиции с фильтрацией и пагинацией
 */
export const getAllPosesUtil = async ({
  filter,
  page,
  limit,
}: GetAllPosesInput): Promise<GetAllPosesResult> => {
  // Строим фильтр
  const mongoFilter: any = {};
  if (filter.palletId) mongoFilter["palletData._id"] = filter.palletId;
  if (filter.rowId) mongoFilter["rowData._id"] = filter.rowId;
  if (filter.rowTitle) mongoFilter["rowData.title"] = filter.rowTitle;
  if (filter.palletTitle) mongoFilter["palletData.title"] = filter.palletTitle;
  if (filter.artikul) mongoFilter.artikul = { $regex: filter.artikul, $options: "i" };
  if (filter.nameukr) mongoFilter.nameukr = { $regex: filter.nameukr, $options: "i" };
  if (filter.sklad) mongoFilter.sklad = { $regex: filter.sklad, $options: "i" };

  const skip = (page - 1) * limit;

  // Получаем позиции
  const poses = await Pos.find(mongoFilter)
    .skip(skip)
    .limit(limit)
    .sort({ artikul: 1 });

  const total = await Pos.countDocuments(mongoFilter);

  return {
    data: poses,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};
