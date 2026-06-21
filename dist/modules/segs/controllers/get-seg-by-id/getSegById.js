import { getSegByIdSchema } from "./schemas/getSegByIdSchema.js";
import { getSegByIdUtil } from "./utils/getSegByIdUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
export const getSegById = async (req, res) => {
    try {
        const { id } = req.params;
        // Валидация входных данных
        const parseResult = getSegByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const seg = await getSegByIdUtil(parseResult.data);
        if (!seg) {
            res.status(200).json({
                exists: false,
                message: "Segment not found",
                data: null,
            });
            return;
        }
        const segObj = seg.toObject();
        res.status(200).json({
            exists: true,
            message: "Segment retrieved successfully",
            data: segObj,
        });
    }
    catch (error) {
        logModuleError("segs", error, "getSegById error:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: error instanceof Error ? error.message : error,
            });
        }
    }
};
