import { Del, IDel } from "../../../models/Del.js";

type UpdateDelTitleByIdUtilInput = {
  id: string;
  title: string;
};

export const updateDelTitleByIdUtil = async (
  input: UpdateDelTitleByIdUtilInput
): Promise<IDel | null> => {
  const del = await Del.findByIdAndUpdate(
    input.id,
    { title: input.title },
    { new: true, runValidators: true }
  );
  return del;
};
