import { getBtradeArtInfoSchema } from "./schemas/getBtradeArtInfoSchema.js";
import { fetchBtradeDataUtil } from "./utils/fetchBtradeDataUtil.js";
export const getBtradeArtInfoController = async (req, res) => {
    try {
        const { artikul } = req.params;
        // Валидация входных данных
        const parseResult = getBtradeArtInfoSchema.safeParse({ artikul });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Artikul is required",
                errors: parseResult.error.errors,
            });
            return;
        }
        const data = await fetchBtradeDataUtil(parseResult.data.artikul);
        if (!data) {
            res.status(200).json({
                exists: false,
                message: "No products found for this artikul",
                data: null,
            });
            return;
        }
        res.status(200).json({
            exists: true,
            message: "Product info retrieved successfully",
            data,
        });
    }
    catch (error) {
        console.error("Error fetching data from sharik.ua:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Failed to fetch data from sharik.ua",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
};
