import { Art } from "../models/Art.js";
export const getArt = async (req, res) => {
    const { artikul } = req.params;
    try {
        const art = await Art.findOne({ artikul: artikul });
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
        res.status(500).json({ message: "Server error", error });
    }
};
