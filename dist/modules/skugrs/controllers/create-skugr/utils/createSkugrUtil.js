import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../models/Skugr.js";
export class InvalidSkuReferencesError extends Error {
    constructor() {
        super("One or more sku IDs do not exist");
        this.name = "InvalidSkuReferencesError";
    }
}
export const createSkugrUtil = async (input) => {
    const uniqueIds = [...new Set(input.skus)];
    if (uniqueIds.length > 0) {
        const count = await Sku.countDocuments({ _id: { $in: uniqueIds } });
        if (count !== uniqueIds.length) {
            throw new InvalidSkuReferencesError();
        }
    }
    const skugr = await Skugr.create({
        konkName: input.konkName,
        prodName: input.prodName,
        title: input.title,
        url: input.url,
        skus: uniqueIds,
    });
    return skugr;
};
