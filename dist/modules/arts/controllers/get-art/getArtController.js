import { getArtSchema } from "./schemas/getArtSchema.js";
import { getArtUtil } from "./utils/getArtUtil.js";
export const getArtController = async (req, res) => {
    try {
        const { artikul } = req.params;
        // Валидация входных данных
        const parseResult = getArtSchema.safeParse({ artikul });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Artikul is required",
                errors: parseResult.error.errors,
            });
            return;
        }
        const art = await getArtUtil(parseResult.data.artikul);
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
        console.error("Error fetching art by artikul:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
