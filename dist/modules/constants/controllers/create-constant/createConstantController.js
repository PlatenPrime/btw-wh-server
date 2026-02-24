import { createConstantSchema } from "./schemas/createConstantSchema.js";
import { createConstantUtil } from "./utils/createConstantUtil.js";
/**
 * @desc    Создать константу
 * @route   POST /api/constants
 */
export const createConstantController = async (req, res) => {
    try {
        const parseResult = createConstantSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const constant = await createConstantUtil({
            name: parseResult.data.name,
            title: parseResult.data.title,
            data: parseResult.data.data ?? {},
        });
        res.status(201).json({
            message: "Constant created successfully",
            data: constant,
        });
    }
    catch (error) {
        console.error("Error creating constant:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
