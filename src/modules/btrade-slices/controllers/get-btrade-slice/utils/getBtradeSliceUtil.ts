import type { Types } from "mongoose";
import { Art } from "../../../../arts/models/Art.js";
import { findDayPointsPage } from "../../../utils/btradeSliceMonthStore.js";
import type { GetBtradeSliceQuery } from "../schemas/getBtradeSliceQuerySchema.js";

type ArtLean = {
  _id: Types.ObjectId;
  artikul: string;
  prodName?: string;
  nameukr?: string;
  namerus?: string;
  zone: string;
  limit?: number;
  marker?: string;
  abc?: string;
  btradeStock?: { value: number; date: Date };
  createdAt?: Date;
  updatedAt?: Date;
};

export type GetBtradeSliceItem = {
  artikul: string;
  quantity: number;
  price: number;
  art: ArtLean | null;
};

export type GetBtradeSliceResult = {
  date: Date;
  items: GetBtradeSliceItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

/**
 * Возвращает постраничный срез Btrade по дате с опциональным фильтром isInvalid.
 * Источник — btrade_slice_months.
 */
export async function getBtradeSliceUtil(
  input: GetBtradeSliceQuery,
): Promise<GetBtradeSliceResult | null> {
  const { page, limit } = input;

  const exists = await findDayPointsPage({
    date: input.date,
    page: 1,
    limit: 1,
  });
  if (exists.total === 0) return null;

  const pageResult = await findDayPointsPage({
    date: input.date,
    page,
    limit,
    ...(input.isInvalid ? { isInvalid: true } : {}),
  });

  const artikuls = pageResult.items.map((r) => r.artikul);
  const arts =
    artikuls.length > 0
      ? ((await Art.find({ artikul: { $in: artikuls } }).lean().exec()) as ArtLean[])
      : [];

  const artByArtikul = new Map<string, ArtLean>();
  for (const art of arts) {
    artByArtikul.set(art.artikul, art);
  }

  const items: GetBtradeSliceItem[] = pageResult.items.map((row) => ({
    artikul: row.artikul,
    quantity: row.quantity,
    price: row.price,
    art: artByArtikul.get(row.artikul) ?? null,
  }));

  const total = pageResult.total;
  const totalPages = Math.ceil(total / limit) || 0;

  return {
    date: pageResult.date,
    items,
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
