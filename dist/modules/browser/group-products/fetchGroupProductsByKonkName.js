import { getAirGroupPagesProducts } from "../air/group-pages/utils/getAirGroupPagesProducts.js";
import { getBalunGroupPagesProducts } from "../balun/group-pages/utils/getBalunGroupPagesProducts.js";
import { getSharteGroupPagesProducts } from "../sharte/group-pages/utils/getSharteGroupPagesProducts.js";
import { getYumiGroupPagesProducts } from "../yumi/group-pages/utils/getYumiGroupPagesProducts.js";
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
        case "yumi": {
            const rows = await getYumiGroupPagesProducts({
                groupUrl: input.groupUrl,
                ...(input.maxPages !== undefined && { maxPages: input.maxPages }),
            });
            return rows.map((p) => ({
                title: p.title,
                url: p.url,
                imageUrl: p.imageUrl,
            }));
        }
        case "air": {
            const rows = await getAirGroupPagesProducts({
                groupUrl: input.groupUrl,
                ...(input.maxPages !== undefined && { maxPages: input.maxPages }),
            });
            return rows.map((p) => ({
                title: p.title,
                url: p.url,
                imageUrl: p.imageUrl,
            }));
        }
        case "sharte": {
            const rows = await getSharteGroupPagesProducts({
                groupUrl: input.groupUrl,
                ...(input.maxPages !== undefined && { maxPages: input.maxPages }),
            });
            return rows.map((p) => ({
                title: p.title,
                url: p.url,
                imageUrl: p.imageUrl,
            }));
        }
        case "balun": {
            const rows = await getBalunGroupPagesProducts({
                groupUrl: input.groupUrl,
                ...(input.maxPages !== undefined && { maxPages: input.maxPages }),
            });
            return rows.map((p) => ({
                title: p.title,
                url: p.url,
                imageUrl: p.imageUrl,
            }));
        }
        default:
            throw new UnsupportedKonkForGroupProductsError(konkName);
    }
}
