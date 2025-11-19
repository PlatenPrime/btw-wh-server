import { Zone } from "../../../zones/models/Zone.js";
export const resetZonesSectors = async (req, res) => {
    try {
        // Установить sector = 0 у всех зон через bulkWrite
        const result = await Zone.updateMany({}, { $set: { sector: 0 } });
        res.status(200).json({
            message: "Zones sectors reset successfully",
            data: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            },
        });
    }
    catch (error) {
        console.error("Error resetting zones sectors:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
