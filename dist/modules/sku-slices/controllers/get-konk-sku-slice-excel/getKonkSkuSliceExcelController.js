import { getKonkSkuSliceExcelSchema } from "./schemas/getKonkSkuSliceExcelSchema.js";
import { getKonkSkuSliceExcelUtil } from "./utils/getKonkSkuSliceExcelUtil.js";
/**
 * @desc    Excel остатков по группе SKU (konk + prod) за период с итогом Підсумок
 * @route   GET /api/sku-slices/konk/excel?konk=&prod=&dateFrom=&dateTo=
 */
export const getKonkSkuStockSliceExcelController = async (req, res) => {
    const parseResult = getKonkSkuSliceExcelSchema.safeParse({
        konk: req.query.konk,
        prod: req.query.prod,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
    });
    if (!parseResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: parseResult.error.errors,
        });
        return;
    }
    const result = await getKonkSkuSliceExcelUtil(parseResult.data);
    if (!result.ok) {
        res.status(404).json({
            message: "No skus found for provided konk/prod, or no sku with productId in group",
        });
        return;
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.status(200).send(result.buffer);
};
