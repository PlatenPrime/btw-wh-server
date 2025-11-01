import { getPalletByTitleSchema } from "./schemas/getPalletByTitleSchema.js";
import { getPalletByTitleUtil } from "./utils/getPalletByTitleUtil.js";
export const getPalletByTitleController = async (req, res) => {
    try {
        const { title } = req.params;
        // Валидация входных данных
        const parseResult = getPalletByTitleSchema.safeParse({ title });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const pallet = await getPalletByTitleUtil(parseResult.data.title);
        if (!pallet) {
            res.status(200).json({
                exists: false,
                message: "Pallet not found",
                data: null,
            });
            return;
        }
        const palletObj = pallet.toObject();
        res.status(200).json({
            exists: true,
            message: "Pallet retrieved successfully",
            data: palletObj,
        });
    }
    catch (error) {
        console.error("getPalletByTitleController error:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: error instanceof Error ? error.message : error,
            });
        }
    }
};
