import type { UpdateQuery } from "mongoose";
import { Art } from "../../../../arts/models/Art.js";
import { Analog, IAnalog } from "../../../models/Analog.js";
import type { UpdateAnalogByIdInput } from "../schemas/updateAnalogByIdSchema.js";

type AnalogUpdateFields = Partial<
  Pick<
    IAnalog,
    "konkName" | "prodName" | "artikul" | "nameukr" | "url" | "title" | "imageUrl"
  >
>;

export const updateAnalogByIdUtil = async (
  input: UpdateAnalogByIdInput
): Promise<IAnalog | null> => {
  const update: AnalogUpdateFields = {};
  const updatable: (keyof UpdateAnalogByIdInput)[] = [
    "konkName",
    "prodName",
    "artikul",
    "nameukr",
    "url",
    "title",
    "imageUrl",
  ];
  for (const key of updatable) {
    const val = input[key];
    if (val !== undefined) (update as Record<string, unknown>)[key] = val;
  }

  if (input.artikul !== undefined && input.artikul.trim() !== "") {
    const art = await Art.findOne({ artikul: input.artikul }).lean();
    update.nameukr = art?.nameukr ?? "";
  }

  if (Object.keys(update).length === 0) {
    return Analog.findById(input.id);
  }

  const analog = await Analog.findByIdAndUpdate(
    input.id,
    update as UpdateQuery<IAnalog>,
    { new: true, runValidators: true }
  );
  return analog as IAnalog | null;
};
