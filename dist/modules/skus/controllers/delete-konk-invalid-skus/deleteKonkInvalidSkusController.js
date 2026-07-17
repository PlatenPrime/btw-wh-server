import { deleteKonkInvalidSkusParamsSchema } from "./schemas/deleteKonkInvalidSkusSchema.js";
import { deleteKonkInvalidSkusUtil } from "./utils/deleteKonkInvalidSkusUtil.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
/**
 * @desc    Видалити всі SKU з isInvalid=true для конкурента :konkName або для всіх конкурентів, якщо :konkName === "all"
 * @route   DELETE /api/skus/konk/:konkName/invalid
 * @access  PRIME
 */
export const deleteKonkInvalidSkusController = async (req, res) => {
    const paramsResult = deleteKonkInvalidSkusParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: paramsResult.error.errors,
        });
        return;
    }
    const { deletedCount } = await deleteKonkInvalidSkusUtil(paramsResult.data.konkName);
    if (req.user?.id) {
        await createEventUtil({
            userId: req.user.id,
            department: "skus",
            type: "delete",
            description: `Видалено невалідні sku для конкурента ${paramsResult.data.konkName}: ${deletedCount} шт.`,
        });
    }
    res.status(200).json({
        message: "Invalid skus deleted",
        deletedCount,
    });
};
