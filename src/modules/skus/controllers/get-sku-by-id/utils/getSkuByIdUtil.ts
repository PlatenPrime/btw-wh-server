import { ISku, Sku } from "../../../models/Sku.js";

export const getSkuByIdUtil = async (id: string): Promise<ISku | null> => {
  const sku = await Sku.findById(id);
  return sku;
};
