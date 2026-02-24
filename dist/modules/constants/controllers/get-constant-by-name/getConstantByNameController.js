import { getConstantByNameSchema } from "./schemas/getConstantByNameSchema.js";
import { getConstantByNameUtil } from "./utils/getConstantByNameUtil.js";
/**
 * @desc    Получить константу по name
 * @route   GET /api/constants/name/:name
 */
export const getConstantByNameController = async (req, res) => {
    try {
        const { name } = req.params;
        const parseResult = getConstantByNameSchema.safeParse({ name });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const constant = await getConstantByNameUtil(parseResult.data.name);
        if (!constant) {
            res.status(404).json({ message: "Constant not found" });
            return;
        }
        res.status(200).json({
            message: "Constant retrieved successfully",
            data: constant,
        });
    }
    catch (error) {
        console.error("Error fetching constant by name:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
