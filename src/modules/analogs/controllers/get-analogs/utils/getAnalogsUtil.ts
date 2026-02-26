import type { Types } from "mongoose";
import { Analog } from "../../../models/Analog.js";
import type { GetAnalogsQuery } from "../schemas/getAnalogsQuerySchema.js";

/** Plain object returned by Analog.find().lean() */
export type AnalogLean = {
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

type GetAnalogsResult = {
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

export const getAnalogsUtil = async ({
  konkName,
  prodName,
  page,
  limit,
}: GetAnalogsQuery): Promise<GetAnalogsResult> => {
  const filter: Record<string, string> = {};
  if (konkName && konkName.trim() !== "") filter.konkName = konkName;
  if (prodName && prodName.trim() !== "") filter.prodName = prodName;

  const [analogs, total] = await Promise.all([
    Analog.find(filter)
      .sort({ createdAt: -1 })
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
