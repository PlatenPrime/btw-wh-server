import { ISku, Sku } from "../../../models/Sku.js";

type CreateSkuUtilInput = {
  konkName: string;
  prodName: string;
  btradeAnalog?: string;
  title: string;
  url: string;
};

export const createSkuUtil = async (
  input: CreateSkuUtilInput
): Promise<ISku> => {
  const sku = await Sku.create({
    konkName: input.konkName,
    prodName: input.prodName,
    btradeAnalog: input.btradeAnalog ?? "",
    title: input.title,
    url: input.url,
  });

  return sku;
};
