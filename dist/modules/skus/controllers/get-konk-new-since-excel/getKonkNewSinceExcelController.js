import { getKonkNewSinceExcelParamsSchema, getKonkNewSinceExcelQuerySchema, } from "./schemas/getKonkNewSinceExcelSchema.js";
import { getKonkNewSinceExcelUtil } from "./utils/getKonkNewSinceExcelUtil.js";
/**
 * @desc    Excel: SKU конкурента, створені не раніше дати since (createdFrom)
 * @route   GET /api/skus/konk/:konkName/new-since-excel?since=YYYY-MM-DD
 */
export const getKonkNewSinceExcelController = async (req, res) => {
    const paramsResult = getKonkNewSinceExcelParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: paramsResult.error.errors,
        });
        return;
    }
    const queryResult = getKonkNewSinceExcelQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: queryResult.error.errors,
        });
        return;
    }
    const { buffer, fileName } = await getKonkNewSinceExcelUtil(paramsResult.data.konkName, queryResult.data);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(buffer);
};
