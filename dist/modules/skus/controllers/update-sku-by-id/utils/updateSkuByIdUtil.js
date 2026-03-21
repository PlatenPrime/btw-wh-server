import { Sku } from "../../../models/Sku.js";
export const updateSkuByIdUtil = async (input) => {
    const update = {};
    if (input.konkName !== undefined)
        update.konkName = input.konkName;
    if (input.prodName !== undefined)
        update.prodName = input.prodName;
    if (input.btradeAnalog !== undefined)
        update.btradeAnalog = input.btradeAnalog;
    if (input.title !== undefined)
        update.title = input.title;
    if (input.url !== undefined)
        update.url = input.url;
    if (input.imageUrl !== undefined)
        update.imageUrl = input.imageUrl;
    if (Object.keys(update).length === 0) {
        return Sku.findById(input.id);
    }
    const sku = await Sku.findByIdAndUpdate(input.id, update, {
        new: true,
        runValidators: true,
    });
    return sku;
};
