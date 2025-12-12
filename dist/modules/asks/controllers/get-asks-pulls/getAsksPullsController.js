import { getAsksPullsUtil } from "./utils/getAsksPullsUtil.js";
export const getAsksPullsController = async (req, res) => {
    try {
        const result = await getAsksPullsUtil();
        res.status(200).json({
            message: "Asks pulls retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("Error fetching asks pulls:", error);
        res.status(500).json({
            message: "Server error while fetching asks pulls",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
