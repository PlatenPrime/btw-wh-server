import { ISku, Sku } from "../../../models/Sku.js";

type UpdateSkuByIdUtilInput = {
  id: string;
  konkName?: string;
  prodName?: string;
  productId?: string;
  artikul?: string;
  btradeAnalog?: string;
  title?: string;
  url?: string;
  imageUrl?: string;
};

export const updateSkuByIdUtil = async (input: UpdateSkuByIdUtilInput): Promise<ISku | null> => {
  const update: Partial<
    Pick<
      ISku,
      | "konkName"
      | "prodName"
      | "productId"
      | "artikul"
      | "btradeAnalog"
      | "title"
      | "url"
      | "imageUrl"
    >
  > = {};

  if (input.konkName !== undefined) update.konkName = input.konkName;
  if (input.prodName !== undefined) update.prodName = input.prodName;
  if (input.productId !== undefined) update.productId = input.productId;
  if (input.artikul !== undefined) update.artikul = input.artikul;
  if (input.btradeAnalog !== undefined) update.btradeAnalog = input.btradeAnalog;
  if (input.title !== undefined) update.title = input.title;
  if (input.url !== undefined) update.url = input.url;
  if (input.imageUrl !== undefined) update.imageUrl = input.imageUrl;

  if (Object.keys(update).length === 0) {
    return Sku.findById(input.id);
  }

  const sku = await Sku.findByIdAndUpdate(input.id, update, {
    returnDocument: "after",
    runValidators: true,
  });

  return sku;
};
