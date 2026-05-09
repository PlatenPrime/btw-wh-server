import type { Types } from "mongoose";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../models/Sku.js";

export type SkuLeanForGetById = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  productId: string;
  btradeAnalog: string;
  title: string;
  url: string;
  imageUrl: string;
  isInvalid: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SkugrLeanForGetSku = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  title: string;
  url: string;
  isSliced: boolean;
  skus: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

export type GetSkuByIdResult = SkuLeanForGetById & { skugrs: SkugrLeanForGetSku[] };

export const getSkuByIdUtil = async (
  id: string,
): Promise<GetSkuByIdResult | null> => {
  const sku = await Sku.findById(id).lean<SkuLeanForGetById | null>().exec();
  if (!sku) {
    return null;
  }
  const skugrs = await Skugr.find({ skus: sku._id })
    .sort({ _id: 1 })
    .lean<SkugrLeanForGetSku[]>()
    .exec();
  return { ...sku, skugrs };
};
