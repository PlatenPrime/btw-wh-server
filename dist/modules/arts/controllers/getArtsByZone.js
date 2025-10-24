import { Art } from "../models/Art.js";
export const getArtsByZone = async (req, res) => {
    try {
        const { zone } = req.params;
        const arts = await Art.find({ zone }).sort({ artikul: 1 });
        res.status(200).json({
            data: arts,
            total: arts.length,
        });
    }
    catch (error) {
        console.error("Error fetching arts by zone:", error);
        res.status(500).json({ message: "Server error" });
    }
};
