import type { UpdateQuery } from "mongoose";
import { Variant, type IVariant } from "../../../models/Variant.js";
import type { UpdateVariantByIdInput } from "../schemas/updateVariantByIdSchema.js";

type VariantUpdateFields = Partial<
  Pick<IVariant, "konkName" | "prodName" | "title" | "url" | "varGroup" | "imageUrl">
>;

export const updateVariantByIdUtil = async (
  input: UpdateVariantByIdInput
): Promise<IVariant | null> => {
  const update: VariantUpdateFields = {};

  const updatable: (keyof UpdateVariantByIdInput)[] = [
    "konkName",
    "prodName",
    "title",
    "url",
    "varGroup",
    "imageUrl",
  ];

  for (const key of updatable) {
    const val = input[key];
    if (val !== undefined) (update as Record<string, unknown>)[key] = val;
  }

  if (Object.keys(update).length === 0) {
    return Variant.findById(input.id);
  }

  const variant = await Variant.findByIdAndUpdate(
    input.id,
    update as UpdateQuery<IVariant>,
    { new: true, runValidators: true }
  );

  return variant as IVariant | null;
};

