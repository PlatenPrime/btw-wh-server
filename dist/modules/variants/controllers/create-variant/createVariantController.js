import { createVariantSchema } from "./schemas/createVariantSchema.js";
import { createVariantUtil } from "./utils/createVariantUtil.js";
function isDuplicateUrlError(err) {
    return (typeof err === "object" &&
        err !== null &&
        "code" in err &&
        err.code === 11000 &&
        err.keyPattern?.url !== undefined);
}
/**
 * @desc    Создать вариант
 * @route   POST /api/variants
 */
export const createVariantController = async (req, res) => {
    try {
        const parseResult = createVariantSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const variant = await createVariantUtil(parseResult.data);
        res.status(201).json({
            message: "Variant created successfully",
            data: variant,
        });
    }
    catch (error) {
        console.error("Error creating variant:", error);
        if (res.headersSent)
            return;
        if (isDuplicateUrlError(error)) {
            res.status(409).json({ message: "Variant with this url already exists" });
            return;
        }
        res.status(500).json({
            message: "Server error",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
};
