import { Art } from "../../../models/Art.js";
/**
 * Получает все артикулы для key-based экспорта.
 */
export const getArtsForExportWithKeysUtil = async () => {
    const arts = await Art.find()
        .sort({ artikul: 1 })
        .select("artikul prodName nameukr namerus zone limit marker abc")
        .lean();
    return arts;
};
