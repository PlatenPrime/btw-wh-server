import { getKonkSkuSalesExcelSchema } from "./schemas/getKonkSkuSalesExcelSchema.js";
import { getKonkSkuSalesExcelUtil } from "./utils/getKonkSkuSalesExcelUtil.js";
/**
 * @desc    Excel продаж по всем SKU конкурента за период
 * @route   GET /api/sku-slices/konk/sales-excel?konk=&dateFrom=&dateTo=
 */
export const getKonkSkuSalesExcelController = async (req, res) => {
    const parseResult = getKonkSkuSalesExcelSchema.safeParse({
        konk: req.query.konk,
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
    const result = await getKonkSkuSalesExcelUtil(parseResult.data);
    if (!result.ok) {
        res.status(404).json({
            message: "No skus found for provided konk, or no sku with productId in group",
        });
        return;
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.status(200).send(result.buffer);
};
