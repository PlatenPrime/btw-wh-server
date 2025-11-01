import { getRowByTitleSchema } from "./schemas/getRowByTitleSchema.js";
import { getRowByTitleUtil } from "./utils/getRowByTitleUtil.js";
export const getRowByTitle = async (req, res) => {
    const { title } = req.params;
    try {
        // Валидация входных данных
        const parseResult = getRowByTitleSchema.safeParse({ title });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const rowData = await getRowByTitleUtil(parseResult.data.title);
        if (!rowData) {
            res.status(200).json({
                exists: false,
                message: "Row not found",
                data: null,
            });
            return;
        }
        res.status(200).json({
            exists: true,
            message: "Row retrieved successfully",
            data: rowData,
        });
    }
    catch (error) {
        console.error("Error fetching row:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Server error", error });
        }
    }
};
