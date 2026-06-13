import { getCatalogInvalidExcelQuerySchema } from "./schemas/getCatalogInvalidExcelSchema.js";
import { getKonkInvalidExcelUtil } from "./utils/getKonkInvalidExcelUtil.js";
/**
 * @desc    Excel: SKU з isInvalid=true (конкурент або `all` — усі конкуренти)
 * @route   GET /api/sku-excel-reports/catalog/invalid?konk=
 */
export const getCatalogInvalidExcelController = async (req, res) => {
    const queryResult = getCatalogInvalidExcelQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: queryResult.error.errors,
        });
        return;
    }
    const { buffer, fileName } = await getKonkInvalidExcelUtil(queryResult.data.konk);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(buffer);
};
