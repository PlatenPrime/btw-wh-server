import { getAirGroupPagesProducts } from "../air/group-pages/utils/getAirGroupPagesProducts.js";
import { getBalunGroupPagesProducts } from "../balun/group-pages/utils/getBalunGroupPagesProducts.js";
import { getSharteGroupPagesProducts } from "../sharte/group-pages/utils/getSharteGroupPagesProducts.js";
import { getYumiGroupPagesProducts } from "../yumi/group-pages/utils/getYumiGroupPagesProducts.js";
import { getYuminGroupPagesProducts } from "../yumin/group-pages/utils/getYuminGroupPagesProducts.js";
function buildGroupPagesFetchArgs(input) {
    return {
        groupUrl: input.groupUrl,
        ...(input.maxPages !== undefined && { maxPages: input.maxPages }),
    };
}
async function fetchGroupPagesProductsVia(input, fetcher) {
    const rows = await fetcher(buildGroupPagesFetchArgs(input));
    return rows.map((p) => ({
        title: p.title,
        url: p.url,
        imageUrl: p.imageUrl,
        productId: p.productId,
    }));
}
export class UnsupportedKonkForGroupProductsError extends Error {
    konkName;
    constructor(konkName) {
        super(`Group products fetch is not implemented for konkName: ${konkName}`);
        this.konkName = konkName;
        this.name = "UnsupportedKonkForGroupProductsError";
    }
}
/**
 * По имени конкурента вызывает соответствующую утилиту обхода страниц группы.
 */
export async function fetchGroupProductsByKonkName(konkName, input) {
    const normalized = konkName.trim().toLowerCase();
    switch (normalized) {
        case "yumi":
            return fetchGroupPagesProductsVia(input, getYumiGroupPagesProducts);
        case "yumin":
            return fetchGroupPagesProductsVia(input, getYuminGroupPagesProducts);
        case "air":
            return fetchGroupPagesProductsVia(input, getAirGroupPagesProducts);
        case "sharte":
            return fetchGroupPagesProductsVia(input, getSharteGroupPagesProducts);
        case "balun":
            return fetchGroupPagesProductsVia(input, getBalunGroupPagesProducts);
        default:
            throw new UnsupportedKonkForGroupProductsError(konkName);
    }
}
