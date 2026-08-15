import { GraboSku } from "../../../models/GraboSku.js";
import type { GraboSkuLean } from "../../../utils/graboSkuLean.js";

export const getGraboSkuByIdUtil = async (
  id: string
): Promise<GraboSkuLean | null> => {
  return GraboSku.findById(id).select("-__v").lean<GraboSkuLean | null>().exec();
};
