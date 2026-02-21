import { getProdByNameSchema } from "./schemas/getProdByNameSchema.js";
import { getProdByNameUtil } from "./utils/getProdByNameUtil.js";
/**
 * @desc    Получить производителя по name
 * @route   GET /api/prods/name/:name
 */
export const getProdByNameController = async (req, res) => {
    try {
        const { name } = req.params;
        const parseResult = getProdByNameSchema.safeParse({ name });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const prod = await getProdByNameUtil(parseResult.data.name);
        if (!prod) {
            res.status(404).json({ message: "Prod not found" });
            return;
        }
        res.status(200).json({
            message: "Prod retrieved successfully",
            data: prod,
        });
    }
    catch (error) {
        console.error("Error fetching prod by name:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
