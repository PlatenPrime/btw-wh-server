import { getAnalogsByProdSchema } from "./schemas/getAnalogsByProdSchema.js";
import { getAnalogsByProdUtil } from "./utils/getAnalogsByProdUtil.js";
/**
 * @desc    Получить аналоги по prodName
 * @route   GET /api/analogs/prod/:prodName
 */
export const getAnalogsByProdController = async (req, res) => {
    try {
        const { prodName } = req.params;
        const parseResult = getAnalogsByProdSchema.safeParse({ prodName });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const analogs = await getAnalogsByProdUtil(parseResult.data.prodName);
        res.status(200).json({
            message: "Analogs retrieved successfully",
            data: analogs,
        });
    }
    catch (error) {
        console.error("Error fetching analogs by prod:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
