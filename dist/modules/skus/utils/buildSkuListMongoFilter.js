import { toSliceDate } from "../../../utils/sliceDate.js";
import { loadSkuIdsReferencedByAnySkugr } from "./loadSkuIdsReferencedByAnySkugr.js";
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/**
 * Mongo-фильтр для списка SKU и для массового удаления «сирот».
 * При `notInAnySkugr === true` не использует `$nin: []` (иначе попали бы все документы).
 */
export async function buildSkuListMongoFilter(query) {
    const { konkName, prodName, search, isInvalid, createdFrom, notInAnySkugr } = query;
    const filter = {};
    if (konkName && konkName.trim() !== "")
        filter.konkName = konkName;
    if (prodName && prodName.trim() !== "")
        filter.prodName = prodName;
    if (search && search.trim() !== "") {
        filter.title = {
            $regex: escapeRegex(search.trim()),
            $options: "i",
        };
    }
    if (typeof isInvalid === "boolean")
        filter.isInvalid = isInvalid;
    if (createdFrom != null) {
        filter.createdAt = { $gte: toSliceDate(createdFrom) };
    }
    if (notInAnySkugr === true) {
        const referenced = await loadSkuIdsReferencedByAnySkugr();
        if (referenced.length > 0) {
            filter._id = { $nin: referenced };
        }
    }
    return filter;
}
