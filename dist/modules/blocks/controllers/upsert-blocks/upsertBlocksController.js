import { upsertBlocksSchema } from "./schemas/upsertBlocksSchema.js";
import { upsertBlocksUtil } from "./utils/upsertBlocksUtil.js";
export const upsertBlocksController = async (req, res) => {
    try {
        const parseResult = upsertBlocksSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const payload = parseResult.data;
        const result = await upsertBlocksUtil({ blocks: payload });
        res.status(200).json({
            message: "Blocks upsert completed",
            data: result,
        });
    }
    catch (error) {
        console.error("upsertBlocksController error:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
