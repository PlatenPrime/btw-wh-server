import { Ask } from "../models/Ask.js";
export const getAskById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "ID is required" });
        return;
    }
    try {
        const ask = await Ask.findById(id);
        if (!ask) {
            res.status(200).json({
                exists: false,
                message: "Ask not found",
                data: null,
            });
            return;
        }
        res.status(200).json({
            exists: true,
            message: "Ask retrieved successfully",
            data: ask,
        });
    }
    catch (error) {
        console.error("Error fetching ask by ID:", error);
        res.status(500).json({
            message: "Server error while fetching ask",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
