import { logModuleError } from "../../../../logging/logModuleError.js";
import { getEventByIdSchema } from "./schemas/getEventByIdSchema.js";
import { getEventByIdUtil } from "./utils/getEventByIdUtil.js";
/**
 * @desc    Получить audit-событие по id
 * @route   GET /api/events/id/:id
 */
export const getEventByIdController = async (req, res) => {
    try {
        const parseResult = getEventByIdSchema.safeParse({ id: req.params.id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const event = await getEventByIdUtil(parseResult.data.id);
        if (!event) {
            res.status(404).json({ message: "Event not found" });
            return;
        }
        res.status(200).json({
            message: "Event retrieved successfully",
            data: event,
        });
    }
    catch (error) {
        logModuleError("events", error, "Error fetching event by id:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
