import { getArtByIdSchema } from "./schemas/getArtByIdSchema.js";
import { getArtByIdUtil } from "./utils/getArtByIdUtil.js";
export const getArtByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        // Валидация входных данных
        const parseResult = getArtByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Invalid art ID format",
                errors: parseResult.error.errors,
            });
            return;
        }
        const art = await getArtByIdUtil(parseResult.data.id);
        if (!art) {
            res.status(200).json({
                exists: false,
                message: "Art not found",
                data: null,
            });
            return;
        }
        res.status(200).json({
            exists: true,
            message: "Art retrieved successfully",
            data: art,
        });
    }
    catch (error) {
        console.error("Error fetching art by ID:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
