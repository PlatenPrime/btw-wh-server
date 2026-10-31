import { ISku, Sku } from "../../../models/Sku.js";

type CreateSkuUtilInput = {
  konkName: string;
  prodName: string;
  productId: string;
  artikul?: string;
  btradeAnalog?: string;
  title: string;
  url: string;
  imageUrl?: string;
};

export const createSkuUtil = async (input: CreateSkuUtilInput): Promise<ISku> => {
  const sku = await Sku.create({
    konkName: input.konkName,
    prodName: input.prodName,
    productId: input.productId,
    artikul: input.artikul ?? "",
    btradeAnalog: input.btradeAnalog ?? "",
    title: input.title,
    url: input.url,
    imageUrl: input.imageUrl ?? "",
  });

  return sku;
};
