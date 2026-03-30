import { setIsSlicedUtil } from "./utils/setIsSlicedUtil.js";
/**
 * @desc    Единоразово проставить isSliced=true для старых skugr без поля isSliced
 * @route   POST /api/skugrs/set-is-sliced
 */
export const setIsSlicedController = async (req, res) => {
    try {
        const result = await setIsSlicedUtil();
        res.status(200).json({
            message: "Skugr isSliced field set successfully",
            data: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            },
        });
    }
    catch (error) {
        console.error("Error setting isSliced for skugrs:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};
