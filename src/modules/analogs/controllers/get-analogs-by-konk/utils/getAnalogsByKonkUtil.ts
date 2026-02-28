import type { Types } from "mongoose";
import { Analog } from "../../../models/Analog.js";
import { buildAnalogSearchFilter } from "../../../utils/buildAnalogSearchFilter.js";
import type { GetAnalogsByKonkInput } from "../schemas/getAnalogsByKonkSchema.js";

type AnalogLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  artikul: string;
  nameukr?: string;
  url: string;
  title?: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type GetAnalogsByKonkResult = {
  analogs: AnalogLean[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export const getAnalogsByKonkUtil = async (
  input: GetAnalogsByKonkInput
): Promise<GetAnalogsByKonkResult> => {
  const { konkName, page, limit, search } = input;

  const baseFilter: Record<string, unknown> = { konkName };
  const searchCondition = buildAnalogSearchFilter(search);
  const filter =
    searchCondition === null
      ? baseFilter
      : { $and: [baseFilter, searchCondition] };

  const [analogs, total] = await Promise.all([
    Analog.find(filter)
      .sort({ artikul: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as Promise<AnalogLean[]>,
    Analog.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    analogs,
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
