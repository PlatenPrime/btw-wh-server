import { createProdSchema } from "./schemas/createProdSchema.js";
import { createProdUtil } from "./utils/createProdUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
/**
 * @desc    Создать производителя
 * @route   POST /api/prods
 */
export const createProdController = async (req, res) => {
    try {
        const parseResult = createProdSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const prod = await createProdUtil({
            name: parseResult.data.name,
            title: parseResult.data.title,
            imageUrl: parseResult.data.imageUrl,
        });
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "prods",
                type: "create",
                description: `Створено виробника ${prod.name} (id: ${prod._id})`,
            });
        }
        res.status(201).json({
            message: "Prod created successfully",
            data: prod,
        });
    }
    catch (error) {
        logModuleError("prods", error, "Error creating prod:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
