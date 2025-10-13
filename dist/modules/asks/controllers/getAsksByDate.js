import { Ask } from "../models/Ask.js";
export const getAsksByDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({
                message: "Date parameter is required in query string",
            });
        }
        // Parse the date string to create start and end of day
        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date format. Please provide a valid date string",
            });
        }
        // Create start and end of the target date
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        // Find asks created on the specific date
        const asks = await Ask.find({
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        }).sort({ createdAt: -1 }); // Sort by creation date, newest first
        // Calculate statistics by status
        const newCount = asks.filter((ask) => ask.status === "new").length;
        const completedCount = asks.filter((ask) => ask.status === "completed").length;
        const rejectedCount = asks.filter((ask) => ask.status === "rejected").length;
        res.status(200).json({
            message: `Found ${asks.length} asks for ${date}`,
            data: asks,
            date: date,
            count: asks.length,
            newCount,
            completedCount,
            rejectedCount,
        });
    }
    catch (error) {
        console.error("Error fetching asks by date:", error);
        res.status(500).json({
            message: "Server error while fetching asks by date",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
