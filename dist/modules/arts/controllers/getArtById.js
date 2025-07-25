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
            res.status(404).json({ message: "Art not found" });
            return;
        }
        res.status(200).json(art);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
