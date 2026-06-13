import { getCatalogNewSinceExcelQuerySchema } from "./schemas/getCatalogNewSinceExcelSchema.js";
import { getKonkNewSinceExcelUtil } from "./utils/getKonkNewSinceExcelUtil.js";
/**
 * @desc    Excel: SKU, створені не раніше since (конкурент або `all` — усі)
 * @route   GET /api/sku-excel-reports/catalog/new-since?konk=&since=YYYY-MM-DD
 */
export const getCatalogNewSinceExcelController = async (req, res) => {
    const queryResult = getCatalogNewSinceExcelQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: queryResult.error.errors,
        });
        return;
    }
    const { buffer, fileName } = await getKonkNewSinceExcelUtil(queryResult.data.konk, { since: queryResult.data.since });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(buffer);
};
