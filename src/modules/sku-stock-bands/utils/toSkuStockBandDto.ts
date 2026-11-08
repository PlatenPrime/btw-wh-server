import type { ISkuStockBand } from "../models/SkuStockBand.js";

export type SkuStockBandDto = {
  _id: string;
  konk: { name: string; title: string };
  stockMin: number;
  stockMax: number;
  normalMax: number;
  createdAt: Date;
  updatedAt: Date;
};

export function toSkuStockBandDto(
  doc: Pick<
    ISkuStockBand,
    "_id" | "konk" | "stockMin" | "stockMax" | "normalMax" | "createdAt" | "updatedAt"
  >,
): SkuStockBandDto {
  return {
    _id: String(doc._id),
    konk: {
      name: doc.konk.name,
      title: doc.konk.title,
    },
    stockMin: doc.stockMin,
    stockMax: doc.stockMax,
    normalMax: doc.normalMax,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
