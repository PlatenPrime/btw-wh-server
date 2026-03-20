import { Sku } from "../../../models/Sku.js";
export const createSkuUtil = async (input) => {
    const sku = await Sku.create({
        konkName: input.konkName,
        prodName: input.prodName,
        btradeAnalog: input.btradeAnalog ?? "",
        title: input.title,
        url: input.url,
    });
    return sku;
};
