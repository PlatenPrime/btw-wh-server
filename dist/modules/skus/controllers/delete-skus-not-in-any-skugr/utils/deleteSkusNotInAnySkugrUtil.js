import { Sku } from "../../../models/Sku.js";
import { buildSkuListMongoFilter } from "../../../utils/buildSkuListMongoFilter.js";
export const deleteSkusNotInAnySkugrUtil = async (query) => {
    const filter = await buildSkuListMongoFilter({
        ...query,
        notInAnySkugr: true,
    });
    const res = await Sku.deleteMany(filter);
    return { deletedCount: res.deletedCount ?? 0 };
};
