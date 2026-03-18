import type { Types } from "mongoose";
import { Variant } from "../../../models/Variant.js";

type VariantByIdLean = {
  _id: Types.ObjectId;
  konkName: string;
  prodName: string;
  title: string;
  url: string;
  varGroup?: { id: string; title: string };
  imageUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export const getVariantByIdUtil = async (
  id: string
): Promise<VariantByIdLean | null> => {
  return (await Variant.findById(id).lean()) as VariantByIdLean | null;
};

