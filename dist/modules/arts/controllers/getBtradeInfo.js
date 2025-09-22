import { getSharikData } from "../../../utils/index.js";
export const getBtradeArtInfo = async (req, res) => {
    const { artikul } = req.params;
    try {
        if (!artikul) {
            res.status(400).json({ message: "Artikul is required" });
            return;
        }
        const data = await getSharikData(artikul);
        if (!data) {
            res.status(404).json({ message: "No products found for this artikul" });
            return;
        }
        res.status(200).json(data);
    }
    catch (error) {
        console.error("Error fetching data from sharik.ua:", error);
        res.status(500).json({
            message: "Failed to fetch data from sharik.ua",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
