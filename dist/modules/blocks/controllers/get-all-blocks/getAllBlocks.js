import { getAllBlocksUtil } from "./utils/getAllBlocksUtil.js";
export const getAllBlocks = async (req, res) => {
    try {
        const blocks = await getAllBlocksUtil();
        res.status(200).json({
            exists: blocks.length > 0,
            message: "Blocks retrieved successfully",
            data: blocks,
        });
    }
    catch (error) {
        console.error("Error fetching all blocks:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
