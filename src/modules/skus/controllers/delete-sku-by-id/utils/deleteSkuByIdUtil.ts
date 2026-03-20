import { ISku, Sku } from "../../../models/Sku.js";

export const deleteSkuByIdUtil = async (id: string): Promise<ISku | null> => {
  const sku = await Sku.findByIdAndDelete(id);
  return sku;
};
