import { getKonkInvalidExcelParamsSchema } from "./schemas/getKonkInvalidExcelSchema.js";
import { getKonkInvalidExcelUtil } from "./utils/getKonkInvalidExcelUtil.js";
/**
 * @desc    Excel: SKU з isInvalid=true (конкурент або `all` — усі конкуренти)
 * @route   GET /api/skus/konk/:konkName/invalid-excel
 */
export const getKonkInvalidExcelController = async (req, res) => {
    const paramsResult = getKonkInvalidExcelParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: paramsResult.error.errors,
        });
        return;
    }
    const { buffer, fileName } = await getKonkInvalidExcelUtil(paramsResult.data.konkName);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(buffer);
};
