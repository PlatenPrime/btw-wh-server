import { Art } from "../../../arts/models/Art.js";
import { clearSharikProductRestsCache, getCachedSharikProductRestsMap, } from "./product-rests/index.js";
export { clearSharikProductRestsCache };
/**
 * Получает данные о товаре с sharik.ua по артикулу через bulk product_rests
 * (актуальный остаток = actualQuantity). nameukr — из коллекции Art.
 */
export async function getSharikStockData(artikul) {
    if (!artikul || typeof artikul !== "string") {
        throw new Error("Artikul is required and must be a string");
    }
    try {
        const map = await getCachedSharikProductRestsMap();
        const row = map.get(artikul);
        if (!row) {
            return null;
        }
        const art = await Art.findOne({ artikul }).select("nameukr").lean();
        const nameukr = typeof art?.nameukr === "string" && art.nameukr.trim() !== ""
            ? art.nameukr
            : "";
        return {
            nameukr,
            price: row.price,
            quantity: row.actualQuantity,
        };
    }
    catch (error) {
        if (error instanceof Error &&
            error.message.startsWith("Artikul is required")) {
            throw error;
        }
        throw new Error(`Failed to fetch data from sharik.ua: ${error instanceof Error ? error.message : String(error)}`);
    }
}
