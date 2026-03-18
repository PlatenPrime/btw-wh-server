import { Variant, type IVariant } from "../../../models/Variant.js";

export const deleteVariantByIdUtil = async (
  id: string
): Promise<IVariant | null> => {
  return Variant.findByIdAndDelete(id);
};

