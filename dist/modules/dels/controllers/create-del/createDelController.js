import { createDelSchema } from "./schemas/createDelSchema.js";
import { createDelUtil } from "./utils/createDelUtil.js";
/**
 * @desc    Создать поставку
 * @route   POST /api/dels
 */
export const createDelController = async (req, res) => {
    try {
        const parseResult = createDelSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const del = await createDelUtil({
            title: parseResult.data.title,
            artikuls: parseResult.data.artikuls ?? {},
        });
        res.status(201).json({
            message: "Del created successfully",
            data: del,
        });
    }
    catch (error) {
        console.error("Error creating del:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
