import mongoose from "mongoose";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { upsertSegsSchema } from "./schemas/upsertSegsSchema.js";
import { upsertSegsUtil } from "./utils/upsertSegsUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
export const upsertSegsController = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const parseResult = upsertSegsSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const payload = parseResult.data;
        let result;
        await session.withTransaction(async () => {
            result = await upsertSegsUtil({
                segs: payload,
                session,
            });
        });
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "segs",
                description: `Масовий upsert сегментів: обробено ${result.processedSegs.length} з ${payload.length} переданих`,
            });
        }
        res.status(200).json({
            message: "Segments upsert completed",
            data: result,
        });
    }
    catch (error) {
        logModuleError("segs", error, "upsertSegsController error:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    finally {
        await session.endSession();
    }
};
