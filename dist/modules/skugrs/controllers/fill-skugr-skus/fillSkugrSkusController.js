import { UnsupportedKonkForGroupProductsError } from "../../../browser/group-products/fetchGroupProductsByKonkName.js";
import { toSkugrDto } from "../../utils/toSkugrDto.js";
import { fillSkugrSkusFromBrowserUtil } from "../../utils/fillSkugrSkusFromBrowserUtil.js";
import { fillSkugrSkusSchema } from "./schemas/fillSkugrSkusSchema.js";
/**
 * @desc    Заполнить состав skugr SKU из парсера страниц группы (browser)
 * @route   POST /api/skugrs/id/:id/fill-skus
 */
export const fillSkugrSkusController = async (req, res) => {
    try {
        const parseResult = fillSkugrSkusSchema.safeParse({
            ...(typeof req.body === "object" && req.body !== null ? req.body : {}),
            id: req.params.id,
        });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const { id, maxPages } = parseResult.data;
        const result = await fillSkugrSkusFromBrowserUtil(id, {
            ...(maxPages !== undefined && { maxPages }),
        });
        if (!result) {
            res.status(404).json({ message: "Skugr not found" });
            return;
        }
        res.status(200).json({
            message: "Skugr skus filled from browser successfully",
            data: toSkugrDto(result.skugr),
            stats: result.stats,
        });
    }
    catch (error) {
        if (error instanceof UnsupportedKonkForGroupProductsError) {
            res.status(400).json({ message: error.message });
            return;
        }
        console.error("Error filling skugr skus from browser:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
