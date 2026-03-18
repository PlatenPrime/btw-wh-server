import { Variant, type IVariant } from "../../../models/Variant.js";
import type { CreateVariantInputOptional } from "../schemas/createVariantSchema.js";

export const createVariantUtil = async (
  input: CreateVariantInputOptional
): Promise<IVariant> => {
  return Variant.create(input);
};

