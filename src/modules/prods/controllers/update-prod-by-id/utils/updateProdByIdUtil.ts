import { Prod, IProd } from "../../../models/Prod.js";

type UpdateProdByIdUtilInput = {
  id: string;
  name?: string;
  title?: string;
  imageUrl?: string;
};

export const updateProdByIdUtil = async (
  input: UpdateProdByIdUtilInput
): Promise<IProd | null> => {
  const update: Partial<Pick<IProd, "name" | "title" | "imageUrl">> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.title !== undefined) update.title = input.title;
  if (input.imageUrl !== undefined) update.imageUrl = input.imageUrl;

  if (Object.keys(update).length === 0) {
    return Prod.findById(input.id);
  }

  const prod = await Prod.findByIdAndUpdate(
    input.id,
    update,
    { new: true, runValidators: true }
  );
  return prod;
};
