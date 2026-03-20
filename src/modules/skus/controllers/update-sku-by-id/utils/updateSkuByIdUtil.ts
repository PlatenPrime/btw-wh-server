import { ISku, Sku } from "../../../models/Sku.js";

type UpdateSkuByIdUtilInput = {
  id: string;
  konkName?: string;
  prodName?: string;
  btradeAnalog?: string;
  title?: string;
  url?: string;
};

export const updateSkuByIdUtil = async (
  input: UpdateSkuByIdUtilInput
): Promise<ISku | null> => {
  const update: Partial<
    Pick<ISku, "konkName" | "prodName" | "btradeAnalog" | "title" | "url">
  > = {};

  if (input.konkName !== undefined) update.konkName = input.konkName;
  if (input.prodName !== undefined) update.prodName = input.prodName;
  if (input.btradeAnalog !== undefined) update.btradeAnalog = input.btradeAnalog;
  if (input.title !== undefined) update.title = input.title;
  if (input.url !== undefined) update.url = input.url;

  if (Object.keys(update).length === 0) {
    return Sku.findById(input.id);
  }

  const sku = await Sku.findByIdAndUpdate(input.id, update, {
    new: true,
    runValidators: true,
  });

  return sku;
};
