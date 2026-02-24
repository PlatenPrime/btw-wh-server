import { Constant, IConstant } from "../../../models/Constant.js";

type UpdateConstantByIdUtilInput = {
  id: string;
  name?: string;
  title?: string;
  data?: Record<string, string>;
};

export const updateConstantByIdUtil = async (
  input: UpdateConstantByIdUtilInput
): Promise<IConstant | null> => {
  const update: Partial<
    Pick<IConstant, "name" | "title" | "data">
  > = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.title !== undefined) update.title = input.title;
  if (input.data !== undefined) update.data = input.data;

  if (Object.keys(update).length === 0) {
    return Constant.findById(input.id);
  }

  const constant = await Constant.findByIdAndUpdate(
    input.id,
    update,
    { new: true, runValidators: true }
  );
  return constant;
};
