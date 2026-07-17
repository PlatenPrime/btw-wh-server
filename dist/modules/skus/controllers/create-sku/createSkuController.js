import { createSkuSchema } from "./schemas/createSkuSchema.js";
import { createSkuUtil } from "./utils/createSkuUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
/**
 * @desc    Создать sku конкурента
 * @route   POST /api/skus
 */
export const createSkuController = async (req, res) => {
    try {
        const parseResult = createSkuSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const sku = await createSkuUtil(parseResult.data);
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "skus",
                type: "create",
                description: `Створено sku "${sku.title}" (id: ${sku._id}, артикул аналога: ${sku.btradeAnalog}) для конкурента ${sku.konkName}`,
            });
        }
        res.status(201).json({
            message: "Sku created successfully",
            data: sku,
        });
    }
    catch (error) {
        logModuleError("skus", error, "Error creating sku:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
