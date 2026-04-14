import { getKonkProdManufacturersPieDataSchema } from "./schemas/getKonkProdManufacturersPieDataSchema.js";
import { getKonkProdManufacturersPieDataUtil } from "./utils/getKonkProdManufacturersPieDataUtil.js";
function firstQuery(q, key) {
    const value = q[key];
    return Array.isArray(value) ? value[0] : value;
}
/**
 * @desc    Данные для pie диаграммы конкурента: продажи в шт/грн по производителям в `data`; итог «Всі виробники» в поле `all`
 * @route   GET /api/sku-slices/konk-prod/manufacturers-pie-data?konk=&dateFrom=&dateTo=
 */
export const getKonkProdManufacturersPieDataController = async (req, res) => {
    const q = req.query;
    const parseResult = getKonkProdManufacturersPieDataSchema.safeParse({
        konk: firstQuery(q, "konk"),
        dateFrom: firstQuery(q, "dateFrom"),
        dateTo: firstQuery(q, "dateTo"),
    });
    if (!parseResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: parseResult.error.errors,
        });
        return;
    }
    const result = await getKonkProdManufacturersPieDataUtil(parseResult.data);
    if (!result.ok) {
        res.status(404).json({
            message: "No sku sales data found for provided konk/date range",
        });
        return;
    }
    res.status(200).json({
        message: "Konk manufacturers pie data retrieved successfully",
        data: result.data,
        all: result.all,
    });
};
