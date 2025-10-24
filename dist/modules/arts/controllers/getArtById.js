import { Art } from "../models/Art.js";
export const getArtById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "ID is required" });
        return;
    }
    try {
        const art = await Art.findById(id);
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
