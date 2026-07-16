import { logModuleError } from "../../../../logging/logModuleError.js";
import { getAllEventsQuerySchema } from "./schemas/getAllEventsSchema.js";
import { getAllEventsUtil } from "./utils/getAllEventsUtil.js";
/**
 * @desc    Получить список audit-событий с фильтрами и пагинацией
 * @route   GET /api/events
 */
export const getAllEventsController = async (req, res) => {
    try {
        const parseResult = getAllEventsQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const result = await getAllEventsUtil(parseResult.data);
        res.status(200).json({
            message: "Events retrieved successfully",
            data: result.events,
            pagination: result.pagination,
        });
    }
    catch (error) {
        logModuleError("events", error, "Error fetching events:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
